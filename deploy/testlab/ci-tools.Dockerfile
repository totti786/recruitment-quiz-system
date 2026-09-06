# One-time CI helper image — fully offline build (no apk CDN).
# apks/ dir (openssh-client + deps, fetched once on an internet machine)
# must sit next to this Dockerfile on the build host. NOT committed to git.
#   tar xzf ci-apks.tar.gz -C deploy/testlab/   # → deploy/testlab/ci-apks/*.apk
#   docker build -f deploy/testlab/ci-tools.Dockerfile -t registry.testlab.local/ci-tools:latest .
#   docker push registry.testlab.local/ci-tools:latest
FROM registry.testlab.local/alpine:latest
COPY deploy/testlab/ci-apks/*.apk /tmp/apks/
RUN apk add --no-cache --allow-untrusted /tmp/apks/*.apk && rm -rf /tmp/apks && ssh -V
