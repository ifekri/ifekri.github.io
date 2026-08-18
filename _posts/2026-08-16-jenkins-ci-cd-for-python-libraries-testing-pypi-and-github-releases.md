---
title: "Jenkins CI/CD for Python Libraries: Testing, PyPI, and GitHub Releases"
date: 2026-08-18 11:20:00 +0300
categories: [Pipelines]
tags: [python, pipeline, pypi, packages, build, jenkins, pip]
description: "Set up a Jenkins pipeline that tests, packages, and publishes your Python library to PyPI, and builds PyInstaller executables for GitHub Releases."
---

A practical, step-by-step guide to a Jenkins pipeline for a Python library — covering tests, linting, and packaging into a wheel and PyInstaller executable. The pipeline finishes by safely publishing releases to TestPyPI, PyPI, and GitHub Releases, with a manual approval step built in.

<!--more-->


The things that Jenkins can do for a Python library builder, which speed up all processes, include the following:

- Fetch the code from the GitHub repository.
- Run tests on every Push or Pull Request.
- Check code quality, formatting, type checking, and dependency security issues.
- Build the Python package, including the wheel and source distribution.
- Generate an executable file with PyInstaller.
- Keep the outputs as Artifacts.
- Publish the package to TestPyPI or PyPI only when a valid Tag is created.
- Add the executable files to GitHub Releases.
- Stop the release if any stage fails.

The suggested architecture for a standard project is as follows:

`GitHub → Jenkins CI → Test/Quality → Build package → Build executable → TestPyPI/PyPI → GitHub Release`

## What Is Jenkins and What Is It Good For?

Jenkins is a CI/CD automation system.

CI, or Continuous Integration, means that with every code change, the necessary operations are performed automatically; for example:

- Installing dependencies
- Running tests
- Running Ruff, Flake8, or Black
- Running mypy
- Building the executable file
- Building the wheel and sdist
- Saving the test report
- Announcing the result on the Pull Request

CD, or Continuous Delivery/Deployment, means that after the CI stages succeed, the release is also carried out in a controlled and automated way; for example:

- Publishing to PyPI
- Creating a GitHub Release
- Uploading Windows, Linux, and macOS files
- Publishing a Docker image
- Deploying to a server

Jenkins is built from three main concepts:

- **Controller:** the user interface, Pipeline scheduling, and Jenkins management.
- **Agent:** the machine on which build and test commands are executed.
- **Pipeline:** the project's execution stages, which are usually placed in a file called `Jenkinsfile` inside the repository.

Placing the Pipeline in `Jenkinsfile` is the recommended approach, because changes to the build and release process are then version-controlled just like the code itself. [Official Pipeline as Code documentation](https://www.jenkins.io/doc/book/pipeline/pipeline-as-code/)

## Is Jenkins Suitable for a GitHub Project?

Yes, especially if you have one of the following needs:

- You want the build to run on your own system or server.
- You need dedicated Windows, macOS, and Linux agents.
- You have internal dependencies or services.
- You want to control all build and release stages yourself.
- You have multiple repositories or multiple different environments.
- You have a heavy executable or a time-consuming build.
- You don't want to be limited to GitHub Actions runners.

But to be honest: if you only have a small Python library on GitHub, GitHub Actions is simpler to set up and maintain. Its important advantage for PyPI is that PyPI supports GitHub Actions as a Trusted Publisher, so there is no need to maintain a permanent token.

As of August 2026, PyPI's official Trusted Publishers include GitHub Actions, Google Cloud, ActiveState, and GitLab CI/CD, and Jenkins is not directly on this list. Therefore, publishing directly from Jenkins to PyPI must be done with an API Token. [Official PyPI Trusted Publishing documentation](https://docs.pypi.org/trusted-publishers/using-a-publisher/)

As a result, you have three choices:

1. Do all testing, building, and publishing with Jenkins.
2. Do testing and building with Jenkins, and do only the PyPI publishing with GitHub Actions/OIDC.
3. Do everything with GitHub Actions.

For learning Jenkins, the first option is entirely valid. For the highest security in PyPI publishing, the second option is a very good architecture.

## The Difference Between Publishing a Library and Publishing an Executable

It is best to keep these two outputs separate:

### PyPI

The following are usually published to PyPI:

- A wheel file with the `.whl` extension
- A source distribution file with the `.tar.gz` extension

The user then installs the project with the following command:

```bash
pip install your-package-name
```

The following command is used for the standard package build:

```bash
python -m build
```

The official Python Packaging guide also recommends building the wheel and sdist with `python -m build` and publishing with Twine. [Official Packaging Python Projects guide](https://packaging.python.org/en/latest/tutorials/packaging-projects/)

### GitHub Releases

Executable files built with PyInstaller are usually placed in GitHub Releases:

- `your-tool-windows-x64.exe`
- `your-tool-linux-x64`
- `your-tool-macos-arm64`
- checksums
- a zip or tar.gz file

We normally do not upload the PyInstaller executable directly to PyPI. PyPI is for Python packages and wheels; GitHub Releases is a more suitable place for standalone executables.

A very important note: PyInstaller is not a cross-compiler. To build the Windows file, the build must be done on Windows; for macOS, on macOS; and for Linux, on Linux. [Official PyInstaller documentation](https://pyinstaller.org/en/stable/)

So if you want three outputs, you need three Jenkins agents:

| Output | Required Jenkins agent |
|---|---|
| Linux executable | Linux |
| Windows `.exe` | Windows |
| macOS executable/app | macOS |

To get started, you can build only the output for your current system and add the other agents later.

## Step One: Preparing the Repository

The suggested structure for a Python library and tool:

```text
your-repository/
├── Jenkinsfile
├── pyproject.toml
├── README.md
├── LICENSE
├── src/
│   └── your_package/
│       ├── __init__.py
│       ├── __main__.py
│       └── cli.py
└── tests/
    ├── test_cli.py
    └── test_core.py
```

In `pyproject.toml`, at minimum the package information and build backend must be present. A simple example with setuptools:

```toml
[build-system]
requires = ["setuptools>=77", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "your-package-name"
version = "0.1.0"
description = "Short description of your tool"
readme = "README.md"
requires-python = ">=3.10"
license = "MIT"
authors = [
    { name = "Your Name", email = "you@example.com" }
]
dependencies = []

[project.scripts]
your-tool = "your_package.cli:main"

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

With the `[project.scripts]` section, after installing the package, users can run this command:

```bash
your-tool
```

This approach is usually better for a Python CLI than simply providing an executable file; you can support both methods:

- Python users: install from PyPI
- Regular users: download the executable from GitHub Releases

Before Jenkins, these commands must succeed on your own system:

```bash
python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
python -m pip install -e .
python -m pip install pytest pytest-cov ruff build twine pyinstaller

ruff check .
pytest
python -m build
python -m twine check --strict dist/*
```

Building a sample executable:

```bash
python -m PyInstaller \
  --noconfirm \
  --clean \
  --onefile \
  --name your-tool \
  src/your_package/__main__.py
```

PyInstaller creates the final file in the `dist` folder. The `--onefile` option turns the output into a single standalone file. [Official PyInstaller guide](https://pyinstaller.org/en/stable/usage.html)

## Step Two: Installing Jenkins

For real use, install Jenkins LTS. The official methods include Docker, Linux, macOS, and Windows. [Official Jenkins installation guide](https://www.jenkins.io/doc/book/installing/)

For a small system, keep two environments separate:

### Learning Environment

For learning, you can install Jenkins on your own computer and temporarily run the builds on that same machine.

Advantages:

- Quick setup
- Suitable for testing
- No need for a VPS or domain

Limitations:

- GitHub cannot send a webhook to `localhost`.
- Jenkins only works when the computer is on.
- It is not reliable for production releases.

In this case, use a periodic repository scan or run the build manually.

### Permanent Environment

For permanent use, it is better for Jenkins to be placed on a VPS or server:

```text
Internet
    |
HTTPS / ci.example.com
    |
Nginx or Caddy
    |
Jenkins Controller
    |
Dedicated Build Agents
```

Jenkins must be behind HTTPS and a reverse proxy. The official Jenkins guide provides examples for Nginx, Apache, Caddy, and other proxies. [Reverse Proxy documentation](https://www.jenkins.io/doc/book/system-administration/reverse-proxy-configuration-with-jenkins/)

In a production environment, it is recommended that the build not run on the controller and that you have a separate agent; Jenkins also considers controller isolation one of the main security recommendations. [Jenkins security guide](https://www.jenkins.io/doc/book/security/)

## Step Three: Initial Jenkins Setup

After installation:

1. Go to the Jenkins address:

```text
http://localhost:8080
```

or in a production environment:

```text
https://ci.example.com
```

2. Find the initial password.

In a Docker installation:

```bash
docker exec jenkins \
  cat /var/jenkins_home/secrets/initialAdminPassword
```

In some Linux installations:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

3. Enter the password on the Unlock Jenkins page.

4. Select the `Install suggested plugins` option.

5. Create a new administrator user.

6. Set the correct Jenkins URL at the following path:

```text
Manage Jenkins
→ System
→ Jenkins Location
→ Jenkins URL
```

In production, it should be something like this:

```text
https://ci.example.com/
```

## Step Four: Installing the Required Plugins in Jenkins

Go to the Plugin Manager from this path:

```text
Manage Jenkins
→ Plugins
→ Available plugins
```

Check for the presence of these plugins:

- Git
- GitHub
- GitHub Branch Source
- Pipeline
- Pipeline: Multibranch
- Credentials Binding
- JUnit
- Workspace Cleanup, optional

For your project, the most important item is `GitHub Branch Source`, because Multibranch Pipeline discovers branches, Pull Requests, and tags from GitHub. In Multibranch Pipeline, Jenkins creates a Pipeline for every branch that has a `Jenkinsfile`. [Official Multibranch Pipeline documentation](https://www.jenkins.io/doc/book/pipeline/multibranch/)

Jenkins plugins are different from Codex plugins or GitHub Apps; these must be installed from within Jenkins itself.

## Step Five: Preparing the Jenkins Agent

The machine that performs the build must have these tools available:

```bash
git --version
python3 --version
python3 -m venv --help
```

To create a GitHub Release automatically, the GitHub CLI is also required:

```bash
gh --version
```

The Pipeline itself installs the Python dependencies inside a virtual environment; therefore, you do not need to install pytest, Ruff, Twine, or PyInstaller globally.

It is better for the agent's Python version to be compatible with the project's `requires-python` value.

For the following sample `Jenkinsfile`, I have assumed an agent with the following label:

```text
python-linux
```

In the Jenkins settings:

```text
Manage Jenkins
→ Nodes
→ New Node
```

Create an agent and set its label:

```text
python-linux
```

For initial testing, if you are using the built-in node, you can temporarily change the following expression in `Jenkinsfile`:

```groovy
agent { label 'python-linux' }
```

to this:

```groovy
agent any
```

But this is not recommended for public or production Jenkins.

## Step Six: Connecting Jenkins to GitHub

### Public Repository

To clone a public repository, a credential is usually not needed, but you need a credential for these cases:

- Avoiding API rate limits
- Viewing Pull Requests
- Sending build status
- Creating a GitHub Release
- Managing webhooks
- A private repository

### Private Repository

For a private repository, use one of these methods:

- GitHub App, more suitable for an enterprise environment
- Fine-grained Personal Access Token, simpler to get started
- SSH deploy key, suitable for a limited clone

To get started, create a fine-grained token specific to that repository. Keep the permissions minimal.

For the token related to scan and checkout, these permissions are usually required:

- Metadata: Read
- Contents: Read
- Pull requests: Read
- Commit statuses: Read/Write, if sending status to GitHub
- Webhooks: Write, only if Jenkins is going to create the webhook itself

If you create the webhook manually, the scan token does not need Webhooks Write.

### Storing the Token in Jenkins

Never place the token in `Jenkinsfile`, `pyproject.toml`, or the GitHub repository.

In Jenkins:

```text
Manage Jenkins
→ Credentials
→ System
→ Global credentials
→ Add Credentials
```

Select the type:

```text
Secret text
```

For the scan token, for example, set this ID:

```text
github-scan-token
```

Jenkins stores credentials in encrypted form, and the Pipeline accesses them using the credential ID. [Official Jenkins Credentials documentation](https://www.jenkins.io/doc/book/using/using-credentials/)

## Step Seven: Creating a Multibranch Pipeline

In Jenkins:

```text
Dashboard
→ New Item
```

1. Choose a name, for example:

```text
your-tool
```

2. Select the following option:

```text
Multibranch Pipeline
```

3. In the `Branch Sources` section:

```text
Add source
→ GitHub
```

4. Enter the repository:

```text
https://github.com/OWNER/REPOSITORY.git
```

5. Select the credential related to the GitHub scan.

6. In `Behaviors`, enable these items:

- Discover branches
- Discover pull requests from origin
- Discover tags

Enabling `Discover tags` is necessary for releasing based on Tags.

7. In `Build Configuration`, keep the following value:

```text
Mode: by Jenkinsfile
Script Path: Jenkinsfile
```

8. In `Orphaned Item Strategy`, limit the retention of deleted branches.

9. Save the settings.

Jenkins will scan the repository and find every branch that has a `Jenkinsfile`.

## Step Eight: Setting Up the Webhook

If Jenkins is on a public HTTPS URL, the Webhook causes the Pipeline to run immediately after a Push or Pull Request.

In GitHub:

```text
Repository
→ Settings
→ Webhooks
→ Add webhook
```

Values:

```text
Payload URL:
https://ci.example.com/github-webhook/
```

```text
Content type:
application/json
```

Required events:

- Push
- Pull request

The official Jenkins plugin usually uses the following endpoint:

```text
$JENKINS_BASE_URL/github-webhook/
```

[Jenkins GitHub Plugin documentation](https://plugins.jenkins.io/github/) and [official guide to creating a Webhook in GitHub](https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks)

Do not disable the SSL verification option in the Webhook. GitHub also explicitly recommends that `insecure_ssl` not be enabled.

If Jenkins is only on `localhost`, GitHub cannot reach it. In this case, you have one of these options:

- Manually running `Scan Multibranch Pipeline Now`
- Setting `Periodically if not otherwise run`
- Temporarily using a secure tunnel for learning
- Moving Jenkins to a public HTTPS server

## Step Nine: Creating the PyPI Credential

In PyPI:

1. Create an account.
2. Enable two-step verification or 2FA.
3. Go to the Account Settings section.
4. Create an API Token.
5. Store it in Jenkins as `Secret text`.

Credential ID:

```text
pypi-project-token
```

Create a separate credential for TestPyPI:

```text
testpypi-token
```

Note: PyPI and TestPyPI are two separate services; their accounts and tokens are not shared.

### The First Release Problem

To create a project-scoped token, the project must first exist on PyPI. On the other hand, a PyPI project is usually created with the first upload.

Since Jenkins is not an official PyPI Trusted Publisher, for the first upload you can:

1. Create a temporary account-scoped token.
2. Upload the first version.
3. Immediately delete the temporary token.
4. Create a project-scoped token specific to that project.
5. Place only the project-scoped token inside Jenkins.

Do the same thing separately for TestPyPI.

## Step Ten: Creating the GitHub Release Token

Create another fine-grained GitHub token that only has access to that same repository.

The permission required to create a Release:

```text
Contents: Read and write
```

Store this token in Jenkins with the following ID:

```text
github-release-token
```

It is better for the scan token and the release token to be separate:

| Credential | Access |
|---|---|
| `github-scan-token` | Read-only for code and PRs |
| `github-release-token` | Creating a GitHub Release |
| `testpypi-token` | Publishing to TestPyPI |
| `pypi-project-token` | Publishing only that project to PyPI |

This separation limits the potential damage from a leaked token.

## A Complete Jenkinsfile to Get Started

This example is written for Linux/macOS. Replace the four values at the beginning of the file with your own project's information:

- `PACKAGE_DISTRIBUTION`
- `APP_NAME`
- `ENTRY_SCRIPT`
- `GITHUB_REPOSITORY`

```groovy
pipeline {
    agent {
        label 'python-linux'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(
            numToKeepStr: '20',
            artifactNumToKeepStr: '10'
        ))
        timeout(time: 45, unit: 'MINUTES')
    }

    environment {
        VENV = '.venv'

        // The name that is in [project].name in the pyproject.toml file
        PACKAGE_DISTRIBUTION = 'your-package-name'

        // The name of the executable file
        APP_NAME = 'your-tool'

        // The PyInstaller entry file
        ENTRY_SCRIPT = 'src/your_package/__main__.py'

        // Without https://github.com
        GITHUB_REPOSITORY = 'OWNER/REPOSITORY'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Create environment') {
            steps {
                sh '''#!/usr/bin/env bash
set -euxo pipefail

python3 -m venv "$VENV"
"$VENV/bin/python" -m pip install --upgrade pip

"$VENV/bin/python" -m pip install -e .
"$VENV/bin/python" -m pip install \
    pytest \
    pytest-cov \
    ruff \
    build \
    twine \
    pyinstaller
'''
            }
        }

        stage('Lint') {
            steps {
                sh '''#!/usr/bin/env bash
set -euxo pipefail

"$VENV/bin/python" -m ruff check .
'''
            }
        }

        stage('Tests') {
            steps {
                sh '''#!/usr/bin/env bash
set -euxo pipefail

mkdir -p reports

"$VENV/bin/python" -m pytest \
    --junitxml=reports/pytest.xml \
    --cov=src \
    --cov-report=term-missing \
    --cov-report=xml:reports/coverage.xml
'''
            }
        }

        stage('Build Python package') {
            steps {
                sh '''#!/usr/bin/env bash
set -euxo pipefail

rm -rf package-dist build

"$VENV/bin/python" -m build \
    --outdir package-dist

"$VENV/bin/python" -m twine check \
    --strict \
    package-dist/*
'''
            }
        }

        stage('Test built wheel') {
            steps {
                sh '''#!/usr/bin/env bash
set -euxo pipefail

rm -rf .smoke-venv
python3 -m venv .smoke-venv

".smoke-venv/bin/python" -m pip install \
    --upgrade pip

".smoke-venv/bin/python" -m pip install \
    package-dist/*.whl

".smoke-venv/bin/python" -m pip check
'''
            }
        }

        stage('Build executable') {
            steps {
                sh '''#!/usr/bin/env bash
set -euxo pipefail

rm -rf binary-dist pyinstaller-build

"$VENV/bin/python" -m PyInstaller \
    --noconfirm \
    --clean \
    --onefile \
    --name "$APP_NAME" \
    --distpath binary-dist \
    --workpath pyinstaller-build \
    "$ENTRY_SCRIPT"

test -x "binary-dist/$APP_NAME"

# If your tool does not have --help, change this line to match your tool.
"binary-dist/$APP_NAME" --help
'''
            }
        }

        stage('Verify release version') {
            when {
                anyOf {
                    tag pattern: 'test-*', comparator: 'GLOB'
                    tag pattern: 'v*', comparator: 'GLOB'
                }
            }

            steps {
                sh '''#!/usr/bin/env bash
set -euxo pipefail

case "$TAG_NAME" in
    v*)
        EXPECTED_VERSION="${TAG_NAME#v}"
        ;;
    test-*)
        EXPECTED_VERSION="${TAG_NAME#test-}"
        ;;
    *)
        echo "Unsupported release tag: $TAG_NAME"
        exit 1
        ;;
esac

PACKAGE_VERSION=$(
    "$VENV/bin/python" -c \
    'import importlib.metadata, sys; print(importlib.metadata.version(sys.argv[1]))' \
    "$PACKAGE_DISTRIBUTION"
)

if [ "$PACKAGE_VERSION" != "$EXPECTED_VERSION" ]; then
    echo "Tag version:     $EXPECTED_VERSION"
    echo "Package version: $PACKAGE_VERSION"
    echo "The tag and pyproject.toml versions do not match."
    exit 1
fi
'''
            }
        }

        stage('Publish to TestPyPI') {
            when {
                tag pattern: 'test-*', comparator: 'GLOB'
            }

            steps {
                withCredentials([
                    string(
                        credentialsId: 'testpypi-token',
                        variable: 'TWINE_PASSWORD'
                    )
                ]) {
                    sh '''#!/usr/bin/env bash
set -euo pipefail
set +x

TWINE_USERNAME=__token__ \
"$VENV/bin/python" -m twine upload \
    --non-interactive \
    --skip-existing \
    --repository testpypi \
    package-dist/*
'''
                }
            }
        }

        stage('Approve production release') {
            when {
                tag pattern: 'v*', comparator: 'GLOB'
            }

            steps {
                timeout(time: 1, unit: 'HOURS') {
                    input(
                        message: 'Tests passed. Publish this version to production PyPI?',
                        ok: 'Publish'
                    )
                }
            }
        }

        stage('Publish to PyPI') {
            when {
                tag pattern: 'v*', comparator: 'GLOB'
            }

            steps {
                withCredentials([
                    string(
                        credentialsId: 'pypi-project-token',
                        variable: 'TWINE_PASSWORD'
                    )
                ]) {
                    sh '''#!/usr/bin/env bash
set -euo pipefail
set +x

TWINE_USERNAME=__token__ \
"$VENV/bin/python" -m twine upload \
    --non-interactive \
    --skip-existing \
    package-dist/*
'''
                }
            }
        }

        stage('Create GitHub Release') {
            when {
                tag pattern: 'v*', comparator: 'GLOB'
            }

            steps {
                withCredentials([
                    string(
                        credentialsId: 'github-release-token',
                        variable: 'GH_TOKEN'
                    )
                ]) {
                    sh '''#!/usr/bin/env bash
set -euo pipefail
set +x

if gh release view "$TAG_NAME" \
    --repo "$GITHUB_REPOSITORY" \
    >/dev/null 2>&1
then
    gh release upload "$TAG_NAME" \
        package-dist/* \
        binary-dist/* \
        --clobber \
        --repo "$GITHUB_REPOSITORY"
else
    gh release create "$TAG_NAME" \
        package-dist/* \
        binary-dist/* \
        --verify-tag \
        --generate-notes \
        --repo "$GITHUB_REPOSITORY"
fi
'''
                }
            }
        }
    }

    post {
        always {
            junit(
                allowEmptyResults: true,
                testResults: 'reports/pytest.xml'
            )

            archiveArtifacts(
                allowEmptyArchive: true,
                artifacts: 'package-dist/*,binary-dist/*,reports/*',
                fingerprint: true
            )
        }

        success {
            echo 'Pipeline completed successfully.'
        }

        failure {
            echo 'Pipeline failed. No later release stage was executed.'
        }

        cleanup {
            deleteDir()
        }
    }
}
```

## What Does This Pipeline Do?

On every branch and Pull Request:

1. It checks out the repository.
2. It creates a virtual environment.
3. It installs the project and the CI tools.
4. It runs Ruff.
5. It runs pytest and coverage.
6. It creates a JUnit report.
7. It creates the wheel and sdist.
8. It checks the package's metadata and description with `twine check`.
9. It installs the built wheel in a clean environment.
10. It builds the executable file with PyInstaller.
11. It tests the executable with `--help`.
12. It archives the outputs in Jenkins.

On Tags with the following structure:

```text
test-0.1.0
```

It publishes the package to TestPyPI.

On Tags with the following structure:

```text
v0.1.0
```

It does the following:

1. It compares the Tag's version with the package's version.
2. It waits for your manual approval.
3. It publishes the package to PyPI.
4. It creates a GitHub Release.
5. It adds the wheel, sdist, and executable to the Release.

The `gh release create` command can create the Release and add the artifact files. [Official GitHub CLI documentation for Release](https://cli.github.com/manual/gh_release_create)

## Why Are Two Types of Tags Suggested?

To prevent accidental publishing:

```text
test-0.1.0  → TestPyPI
v0.1.0      → Production PyPI + GitHub Release
```

For example, first:

```bash
git tag -a test-0.1.0 -m "Test package 0.1.0"
git push origin test-0.1.0
```

Jenkins publishes the package to TestPyPI. Then test it:

```bash
python3 -m venv test-install
source test-install/bin/activate

python -m pip install \
  --index-url https://test.pypi.org/simple/ \
  --extra-index-url https://pypi.org/simple/ \
  your-package-name==0.1.0

your-tool --help
```

If everything is correct, publish the same commit with the main Tag:

```bash
git tag -a v0.1.0 -m "Release 0.1.0"
git push origin v0.1.0
```

Jenkins will publish the version to PyPI and GitHub Releases.

## The Correct Process for Each Release

Follow these steps for each version:

1. Change the version in `pyproject.toml`:

```toml
version = "0.2.0"
```

2. Run the tests locally:

```bash
ruff check .
pytest
python -m build
python -m twine check --strict dist/*
```

3. Commit and push the changes:

```bash
git add pyproject.toml
git commit -m "Prepare release 0.2.0"
git push origin your-branch
```

4. Create a Pull Request.

5. Wait for Jenkins CI to succeed.

6. Merge the Pull Request into `main`.

7. Create the Tag for TestPyPI:

```bash
git checkout main
git pull --ff-only

git tag -a test-0.2.0 -m "Test release 0.2.0"
git push origin test-0.2.0
```

8. Check the installation from TestPyPI.

9. Create the final Tag:

```bash
git tag -a v0.2.0 -m "Release 0.2.0"
git push origin v0.2.0
```

10. Do the manual release approval in Jenkins.

11. Check PyPI and GitHub Releases.

PyPI versions cannot be overwritten. If you published `0.2.0`, to fix it you must create a new version like `0.2.1`; you must not reuse the previous Tag or version.

## Enabling Build Status on Pull Requests

After Jenkins has built the Pull Request at least once, in GitHub you can make the Jenkins result required:

```text
Repository
→ Settings
→ Rules
→ Rulesets
```

or in the older interface:

```text
Settings
→ Branches
→ Branch protection rule
```

Enable these items for the `main` branch:

- Require a pull request before merging
- Require status checks to pass
- Jenkins build check
- Block force pushes
- Restrict direct pushes

Also define a ruleset for `v*` Tags so that only you or authorized people can create a release tag.

This point is very important: `Jenkinsfile` is part of the repository. Someone who can create an arbitrary Tag with a modified Jenkinsfile might try to consume the release credentials. Therefore:

- Restrict the creation of `v*` Tags.
- The release should only be from a reviewed commit in `main`.
- Credentials should only be available inside the release stage.
- Do not give production credentials to Pull Request builds.
- Do not run fork Pull Requests with production credentials.

For higher security, you can split the CI Pipeline and the Release Pipeline into two separate Jobs, and the Release Pipeline should always read the trusted `Jenkinsfile` from the main branch.

## Suggested Tests and Operations Before Publishing

The minimum suggested steps:

- Ruff or Flake8
- pytest
- coverage
- Building the wheel and sdist
- `twine check --strict`
- Installing the wheel in a clean virtual environment
- `pip check`
- Building the executable
- Running a smoke test on the executable
- Matching the Tag version and the package version
- Manual release approval

For a more serious project, also add these items:

- Black format check
- mypy or pyright
- `pip-audit` for dependency vulnerabilities
- Testing on several Python versions
- Testing on Windows/Linux/macOS
- Checksum with SHA-256
- Building an SBOM
- Code signing for Windows
- Signing and notarization for macOS
- Real CLI testing with sample input
- Testing installation from TestPyPI
- Changelog validation
- Checking that the working tree and artifacts are reproducible

For example, for the dependency audit:

```bash
python -m pip install pip-audit
python -m pip_audit
```

For mypy:

```bash
python -m pip install mypy
python -m mypy src
```

For checksumming the Release files:

```bash
sha256sum package-dist/* binary-dist/* > SHA256SUMS
```

Then also add `SHA256SUMS` to the GitHub Release.

## Building the Executable for Three Operating Systems

For cross-platform output, the suggested Jenkins structure:

```text
Jenkins Controller
├── Agent: linux-x64
├── Agent: windows-x64
├── Agent: macos-arm64
└── Agent: macos-x64
```

Each agent must:

1. Check out the same Tag.
2. Have a specific version of Python.
3. Install the dependencies.
4. Run the tests.
5. Run PyInstaller.
6. Save the artifact with the platform's name.

Naming example:

```text
your-tool-linux-x86_64
your-tool-windows-x86_64.exe
your-tool-macos-x86_64
your-tool-macos-arm64
```

For Windows, the virtual environment and file execution commands are different:

```bat
python -m venv .venv
.venv\Scripts\python.exe -m pip install -e .
.venv\Scripts\python.exe -m PyInstaller ...
```

For this case, it is better to later convert the Pipeline to a Jenkins Declarative Matrix or parallel stages.

## Important Security Notes

- Do not put Jenkins on the internet without authentication.
- Use HTTPS.
- Do not enable anonymous access.
- Separate the controller and the build agent.
- Regularly update Jenkins and the plugins.
- Back up `$JENKINS_HOME`.
- Do not put tokens in the repository.
- Do not print tokens inside logs.
- Have a separate credential for each service.
- Make the PyPI token project-scoped.
- Restrict the GitHub Release token to a single repository.
- Restrict the creation of release Tags.
- Do not make production credentials available in anonymous PRs.
- Disable concurrent release builds.
- Put a manual approval on the release stage.
- Limit the retention of logs and artifacts.
- Rotate credentials periodically.

Jenkins warns that masking a secret in the log only prevents accidental disclosure; a malicious Pipeline may still be able to extract the secret. For this reason, only trusted Pipelines should have access to sensitive credentials. [Official guide to using Credentials in Jenkinsfile](https://www.jenkins.io/doc/book/pipeline/jenkinsfile/#handling-credentials)

## Common Problems

### The Webhook Does Not Work

Check the following:

- The Jenkins URL is public and HTTPS.
- The URL ends with `/github-webhook/`.
- GitHub shows the response in the Webhook's Recent Deliveries section.
- The reverse proxy passes through the POST request.
- The Jenkins URL is correct in Jenkins Location.
- The GitHub and GitHub Branch Source plugins are installed.

### The Tag Is Not Found by Jenkins

In Multibranch Pipeline:

```text
Branch Sources
→ Behaviors
→ Discover tags
```

enable this, and then:

```text
Scan Multibranch Pipeline Now
```

run this.

### pytest Is Not Found

Make sure the Pipeline uses the Python inside the virtual environment:

```bash
.venv/bin/python -m pytest
```

not simply:

```bash
pytest
```

### PyPI Gives a File Already Exists Error

The version has already been published. Increase the version:

```toml
version = "0.1.1"
```

and create a new Tag:

```bash
git tag v0.1.1
```

### The Executable Does Not Work on Windows

The file was probably built on Linux. PyInstaller is not a cross-compiler, and the `.exe` must be built on a Windows agent.

### Jenkins Cannot Find the `gh` Command

Install the GitHub CLI on the agent and make sure the Jenkins service user can see it in `PATH`:

```bash
sudo -u jenkins gh --version
```

### Jenkins Uses a Different Python Version

Check on the agent:

```bash
sudo -u jenkins python3 --version
```

If several Pythons exist, put the full path in the Pipeline, or define a specific container/toolchain for the agent.

## My Final Recommendation for Your Project

To get started, this is a low-risk and practical path:

1. Install Jenkins locally and learn its interface.
2. Enable only checkout, Ruff, pytest, and building the package.
3. Build the executable for that same operating system.
4. Keep the artifacts only in Jenkins and do not yet enable automatic publishing.
5. Set up TestPyPI with `test-*` Tags.
6. After a few successful runs, enable production PyPI.
7. Keep manual approval for the final release.
8. Later, add separate Windows/macOS/Linux agents.
9. If PyPI security is a high priority, use Jenkins for CI and use GitHub Actions Trusted Publishing only for the PyPI stage.

So the final answer to your question is entirely positive: Jenkins can handle the entire process of testing, building the library, building the executable, publishing to PyPI, and creating the GitHub Release; you just need to keep the PyPI packages separate from the GitHub Release executables and carefully protect the credentials and release Tags.
