---
title: "Rust CLI tools that feel native"
date: 2026-07-19 14:30:00 +0300
categories: [Tooling]
tags: [rust, cli, developer-experience]
description: "The small design decisions that make a terminal tool feel like it belongs."
---

A CLI tool can be fast, correct, and still feel wrong. The difference between a tool people tolerate and a tool people reach for comes down to a handful of small decisions that most developers skip.

<!--more-->

## Output is the interface

Your CLI's output is its UI. Treat it that way.

```rust
use std::io::{self, Write};

fn main() {
    // Wrong: dumping raw data
    println!("{:?}", results);

    // Right: structured, scannable output
    for item in &results {
        println!("  {}  {:<24}  {}", item.status_icon(), item.name, item.detail);
    }

    // Always flush before exit on interactive output
    io::stdout().flush().unwrap();
}
```

Align columns. Use color to communicate state, not to decorate. Red means failure, green means success, yellow means attention. Never use color as the only signal, and always respect `NO_COLOR`.

## Errors should teach

A good error message tells the user what went wrong and what to do next.

```rust
// Wrong
eprintln!("Error: connection failed");

// Right
eprintln!("error: could not reach registry.example.com:443");
eprintln!("  hint: check your network connection or VPN status");
eprintln!("  hint: run with --offline to use the local cache");
```

Exit codes matter too. Zero for success, non-zero for failure, and different codes for different failure classes so scripts can branch on them.

## Flags should feel inevitable

Follow the conventions users already know:

- `-h` / `--help` for help
- `-v` / `--verbose` for more output
- `-q` / `--quiet` for less output
- `--version` for version info
- `--dry-run` when the tool changes state

Use `clap` with derive macros. The help output it generates is better than anything you'll write by hand.

```rust
use clap::Parser;

#[derive(Parser)]
#[command(name = "wiretap", about = "Inspect HTTP traffic from the terminal")]
struct Args {
    /// Port to listen on
    #[arg(short, long, default_value_t = 8080)]
    port: u16,

    /// Filter by route pattern
    #[arg(short, long)]
    filter: Option<String>,

    /// Output raw JSON instead of formatted text
    #[arg(long)]
    json: bool,
}
```

## Speed is a feature

Users notice startup time. If your tool takes 400ms to print help, it feels broken. Keep the binary small, avoid lazy network calls at startup, and profile the cold path.

The best CLI tools feel instant. That's not an accident. It's a design decision.
