<h1 align="center">BrowserBox by DOSAYGO</h1>
<h3 align="center">Secure Your Web with Remote Browser Isolation</h3>

<p>BrowserBox delivers <strong>enterprise-grade remote browser isolation</strong>, protecting your organization from web-based threats while enabling seamless, secure browsing. Run BrowserBox in Docker for easy deployment on any platform, with <strong>multi-architecture support</strong> for AMD64 and ARM64. A <strong>license key</strong> is required for all usage—unlock advanced security today!</p>

<h2>Why BrowserBox in Docker?</h2>
<ul>
    <li><strong>Unmatched Security</strong>: Stop malware, ransomware, and zero-day attacks before they reach your network.</li>
    <li><strong>Effortless Deployment</strong>: Use <code>bbx docker-run</code> to spin up BrowserBox in seconds.</li>
    <li><strong>Cross-Platform Compatibility</strong>: Supports Docker on Windows, Linux (Debian, Ubuntu, CentOS, RHEL, NixOS), and macOS.</li>
    <li><strong>Multi-Architecture</strong>: Optimized for both AMD64 and ARM64 architectures for maximum compatibility.</li>
    <li><strong>Developer-Friendly</strong>: Embed secure browsing in your apps with our API or automate with Puppeteer/Playwright (coming soon).</li>
</ul>

<p><strong>Caution</strong>: Unlicensed instances display a warning and shut down after 2 minutes. Get your license today!</p>

<h2>Quick Solutions</h2>
<ul>
    <li><a href="https://browse.cloudtabs.net/l" class="cta-button">Get a Commercial License</a> ($99/user/year, volume discounts available)</li>
    <li><a href="https://browse.cloudtabs.net/M/jl" class="cta-button">Get a Non-Commercial License</a> ($39/user/year for individuals, non-profits, government)</li>
    <li><a href="mailto:sales@dosaygo.com?subject=Demo" class="cta-button">Get a free Demo</a> (Join the virtualized browser revolution)</li>
    <li><a href="https://github.com/BrowserBox/BrowserBox" class="cta-button">Explore Documentation</a> (GitHub README, setup guides, and more)</li>
    <li><a href="https://github.com/BrowserBox/BrowserBox/blob/main/ADVANCE.md" class="cta-button">Advanced Setup Guide</a> (Tor, SSH tunneling, and more)</li>
</ul>

<h2>Get Started with <code>bbx docker-run</code></h2>

<ol>
    <li><strong>Install the <code>bbx</code> CLI</strong><br>
        On Linux, macOS, or Docker-compatible systems:
        <pre><code>
        bash &lt;(curl -sSL http://bbx.sh.dosaygo.com) install
        </code></pre>
        Or via NPM:
        <pre><code>
        npm i -g @browserbox/browserbox
        bbx-install
        </code></pre>
    </li>
    <li><strong>Obtain a License Key</strong><br>
        <ul>
            <li><strong>Commercial</strong>: <a href="https://browse.cloudtabs.net/l" class="cta-button">Purchase here</a> for businesses.</li>
            <li><strong>Non-Commercial</strong>: <a href="https://browse.cloudtabs.net/M/jl" class="cta-button">Purchase a license</a> for individuals or non-profits.</li>
            <li><strong>Not sure?</strong>: <a href="mailto:sales@dosaygo.com?subject=Demo" class="cta-button">Be amazed</a> with a demo.</li>
        </ul>
        <p>After purchase, you’ll receive a secure, one-time link to your license key. Save it safely! Lost keys? Contact <a href="mailto:support@dosaygo.com">support@dosaygo.com</a>.</p>
    </li>
    <li><strong>Activate and Run</strong><br>
        Activate your license:
        <pre><code>
        bbx apply YOUR_LICENSE_KEY
        </code></pre>
        Run BrowserBox in Docker:
        <pre><code>
        bbx docker-run [nickname] [--port=PORT_NUMBER]
        </code></pre>
        Access the <strong>Login Link</strong> from any browser. For public internet access, ensure DNS records are set correctly.<br>
        Stop the container:
        <pre><code>
        bbx docker-stop [nickname]
        </code></pre>
    </li>
</ol>

<h2>Key <code>bbx</code> Commands for Docker</h2>
<ul>
    <li><code>bbx docker-run [nickname]</code>: Start BrowserBox in a Docker container.</li>
    <li><code>bbx docker-stop [nickname]</code>: Stop a Dockerized BrowserBox instance.</li>
    <li><code>bbx logs</code>: View BrowserBox logs.</li>
    <li><code>bbx update</code>: Update to the latest BrowserBox version (v11+).</li>
    <li><code>bbx --help</code>: See all commands.</li>
</ul>

<h2>Useful Links</h2>
<ul>
    <li><a href="https://browse.cloudtabs.net/l" class="cta-button">Purchase a Commercial License</a></li>
    <li><a href="https://browse.cloudtabs.net/M/jl" class="cta-button">Purchase a Non-Commercial License</a></li>
    <li><a href="mailto:sales@dosaygo.com?subject=Demo" class="cta-button">Get a Demo for your Team</a></li>
    <li><a href="https://github.com/BrowserBox/BrowserBox" class="cta-button">GitHub Repository</a> (Documentation, setup guides, <code>bbx</code> CLI details)</li>
    <li><a href="https://github.com/BrowserBox/BrowserBox/blob/main/ADVANCE.md" class="cta-button">Advanced Setup Guide</a> (Tor, SSH, advanced configurations)</li>
    <li><a href="https://dosaygo.com" class="cta-button">DOSAYGO Website</a></li>
    <li><a href="https://browse.cloudtabs.net" class="cta-button">CloudTabs SaaS</a></li>
    <li><a href="mailto:support@dosaygo.com">Support</a> | <a href="mailto:support@dosaygo.com">Sales</a> | <a href="mailto:legal@dosaygo.com">Legal</a></li>
</ul>

<h2>License Compliance</h2>
<p>BrowserBox requires a valid license for all deployments. Usage data ensures compliance—see our <a href="https://dosaygo.com/privacy_policy.txt">Privacy Policy</a> and <a href="https://dosaygo.com/terms.txt">Terms</a>.</p>
<p><strong>Important</strong>: A license unlocks full features, ongoing support, and compliance.</p>

<h2>Support</h2>
<ul>
    <li><strong>Technical Support</strong>: <a href="mailto:support@dosaygo.com">support@dosaygo.com</a></li>
    <li><strong>Sales & Licensing</strong>: <a href="mailto:support@dosaygo.com">support@dosaygo.com</a></li>
    <li><strong>Compliance Issues</strong>: <a href="mailto:legal@dosaygo.com">legal@dosaygo.com</a></li>
</ul>

<h2>Copyright</h2>
<p>BrowserBox™ is © 2018-2025 DOSAYGO Corporation USA. All rights reserved. The <code>bbx</code> CLI is open source under <a href="https://github.com/BrowserBox/BrowserBox/blob/main/LICENSE.md">LICENSE.md</a>.</p>
