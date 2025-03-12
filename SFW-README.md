<div align="center">
  <img style="width:80px; height:80px" src="https://raw.githubusercontent.com/BrowserBox/BrowserBox/main/docs/icon.svg" alt="BrowserBox Logo 2023">
  <h1><a href="https://dosaygo.com">BrowserBox</a></h1>
  <small>by <a href="https://dosaygo.com">DOSAYGO</a></small>
</div>

<h2>Secure Your Web with BrowserBox</h2>
<p>BrowserBox v10 requires a <strong>license key</strong> for all usage. <a href="mailto:sales@dosaygo.com?subject=License">Purchase a commercial license</a> or <a href="https://tally.so/r/nPvb1x">join the non-commercial waitlist</a> to unlock a cutting-edge remote browser isolation (RBI) solution.</p>

<blockquote>
  <p><strong>IMPORTANT</strong>: Unlicensed instances display a warning and shut down after 2 minutes.</p>
</blockquote>

<h2>Why License BrowserBox?</h2>
<p>BrowserBox isolates web content in a secure, remote environment, protecting your network while enhancing productivity. With a license, you get:</p>
<ul>
  <li><strong>Advanced Security</strong>: Block malware, ransomware, and zero-day threats.</li>
  <li><strong>Seamless Integration</strong>: Embed secure browsing into apps or safeguard local tabs.</li>
  <li><strong>Exclusive Features</strong>: Zero Latency Mode, customizable security, and mobile-ready design (new in v10 with enhanced Chrome compatibility).</li>
</ul>

<h2>Easy Deployment</h2>
<p>Deploy via NPM, Docker, or 1-Click Cloud (Vultr, AWS, Azure, Linode). A valid license key is your gateway to secure browsing.</p>

<h2>License Compliance</h2>
<p>We enforce licensing to protect your investment. Usage data ensures compliance‚Äîsee our <a href="https://dosaygo.com/privacy.txt">Privacy Policy</a> and <a href="https://dosaygo.com/terms.txt">Terms</a>. Bypassing licensing violates our terms and may lead to legal action.</p>

<h2>FAQ</h2>
<p><strong>Why a license?</strong><br>
  Unlocks full features and ensures compliance with a supported, secure solution.</p>
<p><strong>How to get one?</strong><br>
  Buy at <a href="mailto:sales@dosaygo.com?subject=License">sales@dosaygo.com</a> or join the <a href="https://tally.so/r/nPvb1x">waitlist</a>.</p>

<h2>Support</h2>
<ul>
  <li><strong>Issues</strong>: <a href="https://github.com/BrowserBox/BrowserBox/issues">GitHub</a></li>
  <li><strong>Email</strong>: <a href="mailto:support@dosaygo.com">support@dosaygo.com</a></li>
</ul>

<h2>Using BrowserBox with <code>bbx</code></h2>
<p>The <code>bbx</code> command-line tool simplifies installing, managing, and running BrowserBox. Here’s how to get started:</p>

<h3>Installation</h3>
<p>Ensure <code>curl</code> is installed on your system, then run:</p>
<pre><code>bash &lt;(curl -sSL https://raw.githubusercontent.com/BrowserBox/BrowserBox/refs/heads/main/bbx.sh) install</code></pre>
<p>This downloads and installs BrowserBox along with the <code>bbx</code> CLI. You’ll need a user with passwordless sudo privileges (see <a href="https://web.archive.org/web/20241210214342/https://jefftriplett.com/2022/enable-sudo-without-a-password-on-macos/">macOS example</a> or edit <code>/etc/sudoers</code> on Linux).</p>

<h3>Activating a License</h3>
<p>To use BrowserBox commercially, activate a license first:</p>
<pre><code>bbx activate [seats]</code></pre>
<p>Replace <code>[seats]</code> with the number of licenses you need (default is 1). This opens a Stripe payment page. Once paid, your license key is provisioned automatically. For non-commercial use, join the <a href="https://tally.so/r/nPvb1x">waitlist</a> as noted above.</p>

<h3>Key Commands</h3>
<ul>
  <li><strong><code>bbx run [--port &lt;port&gt;] [--hostname &lt;hostname&gt;]</code></strong>: Starts BrowserBox on the specified port and hostname.</li>
  <li><strong><code>bbx stop</code></strong>: Stops BrowserBox for the current user.</li>
  <li><strong><code>bbx run-as [--temporary] &lt;username&gt; [&lt;port&gt;]</code></strong>: Runs BrowserBox as a specific user; use <code>--temporary</code> to delete the user after stopping.</li>
  <li><strong><code>bbx stop-user &lt;username&gt; [&lt;delay_seconds&gt;]</code></strong>: Stops BrowserBox for a specific user, optionally after a delay.</li>
  <li><strong><code>bbx tor-run [--no-anonymize] [--no-onion]</code></strong>: Runs BrowserBox with Tor for anonymity or onion routing (requires Tor installed).</li>
</ul>
<p>Run <code>bbx --help</code> for full command details.</p>

<h2>Copyright</h2>
<p>© 2024 DOSAYGO Corporation USA. All rights reserved.</p>
<p>All code in this repository is licensed under the terms of <a href="LICENSE.md">LICENSE.md</a> unless otherwise stated.</p>
