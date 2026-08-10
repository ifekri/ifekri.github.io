---
layout: page
title: Tags
kicker: Index
description: "All posts, grouped by tag."
permalink: /tags/
---

{% assign tags = site.tags | sort %}

<div class="tags-cloud">
{% for tag in tags %}
  <a href="#{{ tag[0] | slugify }}" class="tag-chip">
    #{{ tag[0] }}
    <span class="tag-count">{{ tag[1].size }}</span>
  </a>
{% endfor %}
</div>

{% for tag in tags %}
<div class="tag-group" id="{{ tag[0] | slugify }}">
  <h2 class="tag-group-name">#{{ tag[0] }}</h2>
  <div class="tag-group-posts">
    {% for post in tag[1] %}
    <a href="{{ post.url | relative_url }}" class="tag-post-link">
      <span class="tag-post-date">{{ post.date | date: "%Y-%m-%d" }}</span>
      <span>{{ post.title }}</span>
    </a>
    {% endfor %}
  </div>
</div>
{% endfor %}
