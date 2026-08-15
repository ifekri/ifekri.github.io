---
title: "UFW does not protect Docker ports"
date: 2026-08-03 14:40:00 +0300
categories: [Infrastructure]
tags: [docker, ufw, iptables, security, linux]
description: "Your firewall says a port is closed. Your admin panel answers on it from the open internet. Both are telling the truth."
---

I locked a server down, checked `ufw status`, and saw no rule for port 8000. Then I opened `http://server-ip:8000` from another network and my admin dashboard loaded.

<!--more-->

## Where the packet actually goes

UFW writes rules into the `INPUT` chain. Traffic to a published container port does not traverse `INPUT` — Docker DNATs it and it passes through `FORWARD`, where Docker inserts its own accept rules during startup.

So `ufw status` is accurate about what it manages. It just does not manage this.

```bash
# UFW's view — nothing on 8000
sudo ufw status numbered

# Reality
sudo iptables -t nat -L DOCKER -n | grep 8000
```

Every port you publish with `-p` or a compose `ports:` entry is reachable from anywhere the network can reach the host, regardless of what UFW says.

## Two ways to fix it

**Bind to loopback.** The cleanest option when the service is only for you.

```yaml
services:
  panel:
    ports:
      - "127.0.0.1:8000:8000"   # not "8000:8000"
```

Reach it over an SSH tunnel or a private mesh network. A port that is not listening on a public interface cannot be scanned.

**Filter in DOCKER-USER.** Docker provides this chain specifically so your rules survive its own rule generation, and it is evaluated before Docker's accepts.

```bash
sudo iptables -I DOCKER-USER -p tcp --dport 8000 \
  ! -s 203.0.113.10 -j DROP

sudo iptables -L DOCKER-USER -n --line-numbers
```

Persist it, or you lose the rule on the next reboot:

```bash
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

## Read the log, not the config

When something is unreachable and you cannot tell why, the block log names the exact packet.

```bash
sudo grep 'BLOCK' /var/log/ufw.log | tail -5
```

```
[UFW BLOCK] IN=br-82f64cb60043 SRC=10.0.1.5 DST=10.0.0.1 DPT=9631 SYN
```

That single line told me something a dozen assumptions had not: my container network was on `10.0.0.0/8`, not the `172.16.0.0/12` default I had written a rule for. The rule was correct and matched nothing.

## Rules per interface go stale

Do not write rules against `veth` names. They are regenerated every time a container restarts.

```bash
# Fragile — gone after the next restart
sudo ufw allow in on veth617b319 to any port 9631

# Durable — survives container and network recreation
sudo ufw allow from 10.0.0.0/8 to 10.0.0.1 port 9631 proto tcp
```

Bridge names like `br-82f64cb60043` are more stable but still tied to a network that can be recreated. Address-based rules outlive both.

## Audit before you assume

```bash
sudo ss -tulpn | grep LISTEN
```

Anything bound to `0.0.0.0` is public unless something outside UFW is stopping it. Run this on a server you believe is locked down — the results are usually educational.
