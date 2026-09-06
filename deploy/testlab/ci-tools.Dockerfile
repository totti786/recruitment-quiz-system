# One-time CI helper image — build on control (has registry + apk access),
# then CI jobs use it so they never need apk (air-gapped).
#   docker build -f deploy/testlab/ci-tools.Dockerfile -t registry.testlab.local/ci-tools:latest .
#   docker push registry.testlab.local/ci-tools:latest
FROM registry.testlab.local/alpine:latest
RUN apk add --no-cache openssh-client
