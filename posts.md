---
layout: page
title: Field notes
kicker: Writing
description: "Notes on systems, tooling, and the craft of shipping software."
permalink: /posts/
---

<div class="posts-list">

{% for post in site.posts %}
<article class="post-row">
  <time class="post-row-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
  <div class="post-row-body">
    <h3 class="post-row-title">
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </h3>
    <p class="post-row-excerpt">{{ post.excerpt | strip_html | truncatewords: 18 }}</p>
  </div>
  <div class="post-row-meta">
    {% if post.categories.size > 0 %}
    <span>{{ post.categories | first }}</span>
    {% endif %}
    <span>{{ post.content | number_of_words | divided_by: 200 | ceil }} min</span>
  </div>
</article>
{% endfor %}

</div>
