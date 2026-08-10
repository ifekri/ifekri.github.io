---
layout: page
title: Archive
kicker: Full history
description: "Every post, ordered by date."
permalink: /archives/
---

{% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}

{% for year in posts_by_year %}
<h2 class="archive-year">{{ year.name }}</h2>
<div class="archive-list">
  {% for post in year.items %}
  <a href="{{ post.url | relative_url }}" class="archive-row">
    <span class="archive-date">{{ post.date | date: "%m-%d" }}</span>
    <span class="archive-title">{{ post.title }}</span>
  </a>
  {% endfor %}
</div>
{% endfor %}
