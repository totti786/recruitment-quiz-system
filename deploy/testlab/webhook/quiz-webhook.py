#!/usr/bin/env python3
"""Quiz deploy webhook — stdlib only (no pip, air-gap safe).

GitLab push webhook -> this listener -> local build+push+deploy on control.
No SSH keys in CI variables, no code transfers: control pulls the exact SHA
itself (remote URL carries a read-only deploy token, root-only on disk).

Setup: see deploy/testlab/webhook/README.md
"""
import hashlib
import hmac
import json
import os
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

SECRET_FILE = "/etc/quiz-webhook.secret"          # chmod 600, single line token
REPO_DIR = "/home/mtdashli/recruitment-quiz-system-master"
BUILD_DIR = "/home/mtdashli/recruitment-quiz-system-master-ci"
REGISTRY = "registry.testlab.local"
COMPOSE_DIR = "/opt/quiz"
LOG = "/var/log/quiz-webhook.log"
BRANCH = "refs/heads/master"


def log(msg):
    with open(LOG, "a") as f:
        f.write(msg + "\n")
    print(msg, flush=True)


def run(cmd, **kw):
    log("+ " + " ".join(cmd))
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):
        if self.path != "/hooks/quiz":
            self.send_response(404)
            self.end_headers()
            return
        try:
            secret = open(SECRET_FILE).read().strip()
        except OSError:
            self.send_response(500)
            self.end_headers()
            return
        token = self.headers.get("X-Gitlab-Token", "")
        if not hmac.compare_digest(token, secret):
            log("DENIED: bad token")
            self.send_response(403)
            self.end_headers()
            return
        length = int(self.headers.get("Content-Length", 0))
        try:
            event = json.loads(self.rfile.read(length) or b"{}")
        except ValueError:
            self.send_response(400)
            self.end_headers()
            return
        ref = event.get("ref", "")
        sha = event.get("checkout_sha") or event.get("after", "")
        if event.get("object_kind") != "push" or ref != BRANCH or not sha:
            log(f"IGNORED: {event.get('object_kind')} {ref}")
            self.send_response(200)
            self.end_headers()
            return
        tag = sha[:8]
        # Respond first, deploy synchronously (GitLab has a long timeout;
        # failures are visible in the log + container state).
        self.send_response(202)
        self.end_headers()
        try:
            self.deploy(sha, tag)
        except subprocess.CalledProcessError as e:
            log(f"DEPLOY FAILED @{tag}: {e.stderr[-2000:]}")

    def deploy(self, sha, tag):
        image = f"{REGISTRY}/recruitment-quiz:{tag}"
        log(f"DEPLOY @{tag}")
        run(["rm", "-rf", BUILD_DIR])
        run(["mkdir", "-p", BUILD_DIR])
        run(["cp", f"{REPO_DIR}/quiz-alpine-offline.tar.gz", BUILD_DIR + "/"])
        archive = subprocess.run(["git", "-C", REPO_DIR, "archive", sha],
                                     check=True, capture_output=True)
        subprocess.run(["tar", "-x", "-C", BUILD_DIR], input=archive.stdout,
                       check=True)
        run(["docker", "build", "-t", image, "."], cwd=BUILD_DIR)
        run(["docker", "push", image])
        run(["docker", "tag", image, f"{REGISTRY}/recruitment-quiz:latest"])
        run(["docker", "push", f"{REGISTRY}/recruitment-quiz:latest"])
        env = dict(os.environ, TAG=tag)
        run(["docker", "compose", "pull"], cwd=COMPOSE_DIR, env=env)
        run(["docker", "compose", "up", "-d"], cwd=COMPOSE_DIR, env=env)
        # health gate (6 x 5s)
        for _ in range(6):
            ok = subprocess.run(["curl", "-sf", "http://localhost:3001/api/health"])
            if ok.returncode == 0:
                log(f"DEPLOY OK @{tag}")
                return
            subprocess.run(["sleep", "5"])
        raise subprocess.CalledProcessError(1, ["curl"], stderr="healthcheck failed")


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9000
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()
