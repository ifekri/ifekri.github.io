---
layout: page
title: About
kicker: Operator profile
description: "Who I am, what I work on, and how I got here."
permalink: /about/
---

<div class="about-grid">

<aside class="about-panel">
  <div class="about-panel-row">
    <span class="about-panel-key">Handle</span>
    <span class="about-panel-val">{{ site.owner.name }}</span>
  </div>
  <div class="about-panel-row">
    <span class="about-panel-key">Role</span>
    <span class="about-panel-val">{{ site.owner.role }}</span>
  </div>
  <div class="about-panel-row">
    <span class="about-panel-key">Base</span>
    <span class="about-panel-val">{{ site.owner.location }}</span>
  </div>
  <div class="about-panel-row">
    <span class="about-panel-key">Status</span>
    <span class="about-panel-val is-ok">{{ site.owner.status }}</span>
  </div>
  <div class="about-panel-row">
    <span class="about-panel-key">Focus</span>
    <span class="about-panel-val">Systems, tools, platforms</span>
  </div>
  <div class="about-panel-row">
    <span class="about-panel-key">Contact</span>
    <span class="about-panel-val"><a href="mailto:{{ site.owner.email }}">Email</a></span>
  </div>
</aside>

<div class="about-main">

I write software that other people depend on. That means I care less about clever code and more about boring reliability, clear interfaces, and systems that fail loudly instead of silently.

## What I do

Most of my work sits at the intersection of systems programming, platform engineering, and developer tooling. I build the parts of the stack that nobody notices until they break, and I try very hard to make sure they never break.

That usually means Rust or Go for performance-critical paths, Python for automation and glue, TypeScript when the work touches a browser, and Terraform when the work touches a cloud.

## How I work

Small commits. Honest commit messages. Tests that actually run in CI. Documentation written for the next person, not for me. If a system needs a runbook, the runbook ships with the system.

## Background

I started with Python scripts that automated the boring parts of other people's jobs. That turned into backend systems, then infrastructure, then a habit of building tools whenever I hit the same problem twice.

<div class="timeline">

<div class="timeline-item">
<div class="timeline-year">2026</div>
<div class="timeline-title">Independent systems work</div>
<div class="timeline-desc">Contracting on infrastructure, developer tooling, and reliability. Writing in public.</div>
</div>

<div class="timeline-item">
<div class="timeline-year">2024</div>
<div class="timeline-title">Platform engineering</div>
<div class="timeline-desc">Owned CI/CD and deployment pipelines for a distributed team. Cut deploy time from 40 minutes to 6.</div>
</div>

<div class="timeline-item">
<div class="timeline-year">2022</div>
<div class="timeline-title">Open source tooling</div>
<div class="timeline-desc">Started releasing the utilities I was building for myself. Some of them stuck.</div>
</div>

<div class="timeline-item">
<div class="timeline-year">2019</div>
<div class="timeline-title">Backend engineering</div>
<div class="timeline-desc">Shipped production APIs and data pipelines. Learned that uptime is a feature you design, not hope for.</div>
</div>

</div>

</div>

</div>

## Proficiency

<div class="skill-set">

<div class="skill-row">
  <span class="skill-name">Python</span>
  <div class="skill-track"><div class="skill-fill" data-level="94"></div></div>
  <span class="skill-val">94%</span>
</div>

<div class="skill-row">
  <span class="skill-name">Rust</span>
  <div class="skill-track"><div class="skill-fill" data-level="82"></div></div>
  <span class="skill-val">82%</span>
</div>

<div class="skill-row">
  <span class="skill-name">TypeScript</span>
  <div class="skill-track"><div class="skill-fill" data-level="88"></div></div>
  <span class="skill-val">88%</span>
</div>

<div class="skill-row">
  <span class="skill-name">Go</span>
  <div class="skill-track"><div class="skill-fill" data-level="76"></div></div>
  <span class="skill-val">76%</span>
</div>

<div class="skill-row">
  <span class="skill-name">Terraform</span>
  <div class="skill-track"><div class="skill-fill" data-level="84"></div></div>
  <span class="skill-val">84%</span>
</div>

<div class="skill-row">
  <span class="skill-name">PostgreSQL</span>
  <div class="skill-track"><div class="skill-fill" data-level="80"></div></div>
  <span class="skill-val">80%</span>
</div>

</div>

## Colophon

This site is built with Jekyll and hosted on GitLab Pages and GitHub Pages. It uses IBM Plex Mono and IBM Plex Sans. There are no photographs on the home page, by design. The aesthetic is the point.
