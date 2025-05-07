<div align="center">
  <img style="width:80px; height:80px" src="https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/docs/icon.svg" alt="BrowserBox Logo 2023">
  <h1><a href="https://dosaygo.com">BrowserBox</a></h1>
  <small>by <a href="https://dosaygo.com">DOSAYGO</a></small>
</div>

<h1>BrowserBox on Docker</h1>
<p><strong>THE ULTIMATE BROWSING POWERHOUSE—SECURE, SCALABLE, UNSTOPPABLE!</strong><br>
BrowserBox v11 by DOSAYGO delivers remote browser isolation (RBI) built for infra, cyber, and product teams. Deploy it anywhere—Linux, macOS, your stack. <strong>LICENSE REQUIRED!</strong> Unlicensed instances shut down after 7 minutes. Unlock now at <a href="https://browse.cloudtabs.net/l">BrowserBox Activation</a>—bulk deals available!</p>

<h2>🚀 Deploy in One Command</h2>
<p><strong>Step 1: Get Your License</strong> – <a href="https://browse.cloudtabs.net/l">Activate BrowserBox</a><br>
<strong>Step 2: Launch It</strong> – Built on a rock-solid Debian base, it runs everywhere!</p>
<pre><code>bash -c "$(curl -fsSL https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/deploy-scripts/run_docker.sh)" <PORT> <HOSTNAME> <EMAIL></code></pre>
<ul>
  <li><strong>&lt;PORT&gt;</strong>: e.g., 8080 (reserves 8088-8092)</li>
  <li><strong>&lt;HOSTNAME&gt;</strong>: DNS A record (e.g., bb.corpdomain.com)</li>
  <li><strong>&lt;EMAIL&gt;</strong>: Your admin email</li>
</ul>
<p><strong>Output:</strong> Pulls the latest <code>dosaygo/browserbox</code> or <code>ghcr.io/browserbox/browserbox</code>, generates a secure login link inside the container, and returns the container ID—ready in seconds!</p>

<h2>Secure Your Web with BrowserBox</h2>
<p>BrowserBox v11 requires a <strong>license key</strong> to operate. <a href="https://browse.cloudtabs.net/l">Purchase a commercial license</a> or <a href="https://tally.so/r/nPvb1x">join the non-commercial waitlist</a> for a cutting-edge RBI solution.</p>
<blockquote>
  <p><strong>NOTE:</strong> Unlicensed instances display a warning and terminate after 2 minutes.</p>
</blockquote>

<h2>Why License BrowserBox?</h2>
<p>BrowserBox isolates web content in a secure, remote environment, safeguarding your network while boosting productivity. With a license, you unlock:</p>
<ul>
  <li><strong>Advanced Security:</strong> Block malware, ransomware, and zero-day threats</li>
  <li><strong>Seamless Integration:</strong> Embed secure browsing into apps or protect local tabs</li>
  <li><strong>Exclusive Features:</strong> Zero Latency Mode, customizable security, and mobile-ready design (new in v11 with enhanced Chrome compatibility)</li>
</ul>

<h2>Easy Deployment</h2>
<p>Deploy via Docker, NPM, or 1-click cloud setups (Vultr, AWS, Azure, Linode). A valid license key is your ticket to secure browsing.</p>

<h2>License Compliance</h2>
<p>Licensing ensures a supported, secure solution. Usage data enforces compliance—see our <a href="https://dosaygo.com/privacy.txt">Privacy Policy</a> and <a href="https://dosaygo.com/terms.txt">Terms</a>. Bypassing licensing violates our terms and may result in legal action.</p>

<h2>FAQ</h2>
<p><strong>Why a license?</strong><br>
Unlocks full features and ensures a compliant, secure experience.</p>
<p><strong>How do I get one?</strong><br>
Purchase at <a href="https://browse.cloudtabs.net/l">BrowserBox Activation</a> or join the <a href="https://tally.so/r/nPvb1x">waitlist</a>.</p>

<h2>Support</h2>
<ul>
  <li><strong>Issues:</strong> <a href="https://github.com/BrowserBox/BrowserBox/issues">GitHub</a></li>
  <li><strong>Email:</strong> <a href="mailto:support@dosaygo.com">support@dosaygo.com</a></li>
</ul>

<h2>Using BrowserBox with <code>bbx</code></h2>
<p>The <code>bbx</code> CLI simplifies installation, management, and operation. Get started:</p>

<h3>Installation</h3>
<p>With <code>curl</code> installed, run:</p>
<pre><code>bash <(curl -sSL https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/bbx.sh) install</code></pre>
<p>Installs BrowserBox and <code>bbx</code>. Requires a user with passwordless sudo (see <a href="https://web.archive.org/web/20241210214342/https://jefftriplett.com/2022/enable-sudo-without-a-password-on-macos/">macOS guide</a> or edit <code>/etc/sudoers</code> on Linux). Full setup at <a href="https://github.com/BrowserBox/BrowserBox?tab=readme-ov-file#using-browserbox-with-bbx">GitHub</a>.</p>

<h3>Activating a License</h3>
<p>Activate your license:</p>
<pre><code>bbx activate [seats]</code></pre>
<p><code>[seats]</code> is the number of licenses (default: 1). Opens a Stripe payment page; your key is provisioned post-payment. Non-commercial users: <a href="https://tally.so/r/nPvb1x">join the waitlist</a>.</p>

<h3>Key Commands</h3>
<ul>
  <li><strong><code>bbx run [--port &lt;port&gt;] [--hostname &lt;hostname&gt;]</code></strong>: Starts BrowserBox</li>
  <li><strong><code>bbx stop</code></strong>: Stops BrowserBox for the current user</li>
  <li><strong><code>bbx run-as [--temporary] &lt;username&gt; [&lt;port&gt;]</code></strong>: Runs as a specific user; <code>--temporary</code> deletes the user after stopping</li>
  <li><strong><code>bbx stop-user &lt;username&gt; [&lt;delay_seconds&gt;]</code></strong>: Stops for a specific user, with optional delay</li>
  <li><strong><code>bbx tor-run [--no-anonymize] [--no-onion]</code></strong>: Runs with Tor (requires Tor installed)</li>
</ul>
<p>See <code>bbx --help</code> for more.</p>

<h2>🔥 Why It’s a Game-Changer</h2>
<ul>
  <li><strong>Cyber Lockdown:</strong> Zero-trust RBI—eliminate threats, protect your org</li>
  <li><strong>Infra Beast:</strong> Dockerized scale—handles 10 or 10,000 users flawlessly</li>
  <li><strong>Product Edge:</strong> Proxy APIs, automate workflows, co-browse—ship faster</li>
</ul>

<h2>⚠️ Must-Knows</h2>
<ul>
  <li><strong>License Required:</strong> No key, no run—bulk pricing at <a href="mailto:sales@dosaygo.com">sales@dosaygo.com</a></li>
  <li><strong>Cross-Platform:</strong> Runs on Linux (Ubuntu, CentOS, Fedora) and macOS</li>
  <li><strong>Network:</strong> Open 5 ports (e.g., 8088-8092), set a DNS A record</li>
  <li><strong>Privileges:</strong> Requires sudo or root access</li>
</ul>

<h2>💡 Power Tips</h2>
<ul>
  <li><strong>Scale:</strong> Spin up more instances—license per seat</li>
  <li><strong>Inspect:</strong> <code>docker exec -it &lt;CONTAINER_ID&gt; bash</code></li>
  <li><strong>Stop:</strong> <code>docker stop &lt;CONTAINER_ID&gt;</code></li>
  <li><strong>Debug:</strong> <code>docker logs &lt;CONTAINER_ID&gt;</code></li>
</ul>

<h2>📡 Get Started</h2>
<p><strong>Licenses/Demos:</strong> <a href="mailto:sales@dosaygo.com">sales@dosaygo.com</a><br>
<strong>Support:</strong> <a href="mailto:hello@dosaygo.com?subject=BrowserBox%20Support">hello@dosaygo.com</a><br>
<strong>Docs:</strong> <a href="https://github.com/BrowserBox/BrowserBox">GitHub</a></p>

<p><strong>SECURE YOUR STACK—LICENSE UP—DEPLOY THE FUTURE!</strong></p>

<h2>Copyright</h2>
<p>© 2024 DOSAYGO Corporation USA. All rights reserved.<br>
Code licensed under <a href="https://github.com/BrowserBox/BrowserBox/blob/main/LICENSE.md">LICENSE.md</a> unless otherwise stated.</p>
