# Webhook deploy (alternative to CI SSH jobs)

Push path: GitLab `master` push -> `http://10.11.204.9:9000/hooks/quiz`
-> `quiz-webhook.py` verifies `X-Gitlab-Token`, builds the exact SHA locally,
pushes to the registry, `compose up`, health-gates. Nothing leaves the lab.

## One-time setup (on control, no internet needed)

```bash
# 1. read-only deploy token: GitLab UI -> project -> Settings -> Repository ->
#    Deploy Tokens -> read_repository. Then bake it into the remote (root-only):
git remote set-url origin \
  https://gitlab-ci-token:<TOKEN>@gitlab.testlab.local/app/recruitment-quiz-system.git
git fetch origin   # must succeed without prompting

# 2. shared webhook secret (same value goes into GitLab webhook config):
openssl rand -hex 32 > /etc/quiz-webhook.secret
chmod 600 /etc/quiz-webhook.secret

# 3. install listener (from repo):
mkdir -p /opt/quiz-webhook
cp deploy/testlab/webhook/quiz-webhook.py /opt/quiz-webhook/
cp deploy/testlab/webhook/quiz-webhook.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now quiz-webhook
systemctl status quiz-webhook --no-pager | head -5

# 4. firewall: GitLab host only (GitLab lives at 10.11.204.5):
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="10.11.204.5/32" port port="9000" protocol="tcp" accept'
firewall-cmd --reload
```

## GitLab side (project -> Settings -> Webhooks)

- URL: `http://10.11.204.9:9000/hooks/quiz`
- Secret token: contents of `/etc/quiz-webhook.secret`
- Trigger: Push events, branch `master`
- SSL verification: off (plain HTTP inside the lab)

## Verify

```bash
git push gitlab master        # or the mirrored push that GitLab sees
sleep 60; tail -20 /var/log/quiz-webhook.log   # DEPLOY OK @<sha>
curl -sf http://localhost:3001/api/health
```

## Notes

- Keep the CI SSH `deploy:control` job as a manual fallback (already in
  `.gitlab-ci.yml` history) — belt and suspenders.
- `/opt/quiz/.env.production` is still written by CI on first deploy; the
  webhook path reuses that file, so run CI deploy once before switching over.
