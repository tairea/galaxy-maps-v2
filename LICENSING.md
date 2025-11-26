# Galaxy Maps Licensing Strategy

Galaxy Maps uses a **dual-license model** that balances openness, community contribution, and long-term protection of the platform.

## Overview

This licensing strategy ensures that:
- All improvements to the core platform remain open-source
- The ecosystem stays community-owned and protected from private SaaS forks
- Developers have maximum flexibility to build extensions and integrations
- Transparency and trust remain central for schools, ministries, educators, and community developers

## License Structure

### 1. Core Platform – AGPL-3.0 License

**Applies to:** The main Galaxy Maps platform, including:
- Backend services and Cloud Functions (`/functions/`)
- Core frontend application (`/src/`)
- Mission engine and learning map logic
- Database schemas and security rules (`/rules/`)
- Galaxy OS runtime
- All server-side components

**License:** [GNU Affero General Public License v3.0](./LICENSE)

**What this means:**
- ✅ All improvements to the platform must remain open-source
- ✅ Organizations offering Galaxy Maps as a hosted service must publish their modifications
- ✅ The ecosystem stays community-owned and protected from proprietary forks
- ✅ Ensures transparency and trust for educators, schools, and learners
- ✅ Anyone can use, modify, and distribute the software freely

**Why AGPL-3.0?**
The AGPL-3.0 license includes a "network copyleft" provision (Section 13) that requires anyone who runs a modified version of Galaxy Maps as a web service to make their source code available. This ensures that improvements made by hosted service providers benefit the entire community.

### 2. Extensions, SDKs, and Developer Tooling – Apache 2.0 License

**Applies to:** Components designed for integration, extension, or local use:
- API SDKs and client libraries
- CLI tools and development utilities
- Agent frameworks and AI integrations
- Widgets, plugins, and editor modules
- Utility libraries and helper functions
- Browser extensions and desktop tools

**License:** [Apache License 2.0](./LICENSE-APACHE-2.0)

**What this means:**
- ✅ Encourages widespread adoption
- ✅ Easy for developers to build on Galaxy Maps
- ✅ Provides patent protection
- ✅ Allows commercial use without forcing open-source disclosure
- ✅ Grows a healthy ecosystem around the core platform

**Why Apache 2.0?**
Apache 2.0 is permissive and widely trusted, making it easy for schools, organizations, and developers to integrate Galaxy Maps into their workflows without licensing concerns. It includes explicit patent grants that protect users from patent litigation.

## Identifying Which License Applies

When contributing to or using Galaxy Maps code, use this guide:

### AGPL-3.0 Components (Core Platform)
```
/functions/              - All Cloud Functions
/src/
  /views/               - Core application views
  /components/          - UI components
  /store/               - State management
  /router/              - Application routing
  /lib/                 - Core library code
/rules/                 - Firestore security rules
/firebase.json          - Firebase configuration
```

### Apache 2.0 Components (Extensions & Tools)
```
/sdk/                   - Client SDKs (if created)
/cli/                   - Command-line tools (if created)
/plugins/               - Extension plugins (if created)
/widgets/               - Embeddable widgets (if created)
```

**Note:** As of this version, most extension components are planned for future releases. Currently, the majority of the codebase is under AGPL-3.0.

## For Contributors

### Contributing to Core Platform (AGPL-3.0)
When you contribute code to the core Galaxy Maps platform:

1. Your contribution will be licensed under AGPL-3.0
2. You retain copyright to your contribution
3. You grant the Galaxy Maps project the right to use and distribute your contribution under AGPL-3.0
4. Your contribution must be compatible with AGPL-3.0

### Contributing Extensions/Tools (Apache 2.0)
When creating extensions, SDKs, or developer tools:

1. Your contribution will be licensed under Apache 2.0
2. You retain copyright to your contribution
3. Others can use your contribution in both open-source and commercial projects

## For Users and Organizations

### Using Galaxy Maps

**Self-Hosted Deployment (AGPL-3.0 applies):**
- ✅ You can freely deploy Galaxy Maps on your own infrastructure
- ✅ You can modify the code to suit your needs
- ⚠️ If you modify the code and run it as a web service, you must make your modifications available under AGPL-3.0
- ⚠️ You must provide a way for users to access the source code (e.g., a link in the UI or documentation)

**Using Official Hosted Service:**
- ✅ Use the official Galaxy Maps hosted service without any licensing obligations
- ✅ Create and share learning galaxies freely
- ✅ No source code distribution requirements

**Building Integrations (Apache 2.0 tools when available):**
- ✅ Use Apache 2.0 licensed SDKs and tools freely
- ✅ Create proprietary integrations and extensions
- ✅ No source code disclosure required for your integration code

### Compliance Checklist for Self-Hosted AGPL Deployments

If you're running a modified version of Galaxy Maps as a web service:

- [ ] Make your modified source code available
- [ ] Include a prominent notice in your application with a link to the source
- [ ] Ensure your modifications are licensed under AGPL-3.0
- [ ] Preserve all copyright and license notices
- [ ] Document what changes you made

**Example compliance notice:**
```
This service runs on Galaxy Maps, an open-source learning platform.
Licensed under AGPL-3.0. Source code: [your-repo-url]
```

## Copyright

```
Copyright (c) 2020-2025 Galaxy Maps Contributors
```

Galaxy Maps is developed by a community of educators, developers, and learning innovators worldwide.

## Why This Licensing Approach?

This dual-license strategy is inspired by successful open-source projects like GitLab, Supabase, and Grafana. It provides:

1. **Strong Protection (AGPL)** where it matters most – the core platform remains open and community-owned
2. **Maximum Flexibility (Apache)** where innovation benefits everyone – extensions and tools can be freely integrated
3. **Sustainable Growth** – enables a healthy ecosystem while preventing platform capture by private interests
4. **Trust & Transparency** – educators and institutions can verify and audit the entire system
5. **Community Ownership** – ensures Galaxy Maps remains a global public good for education

## Questions?

- **Can I use Galaxy Maps in my school?** Yes! Freely use the platform under AGPL-3.0.
- **Can I modify Galaxy Maps?** Yes! Modify it freely, but share your improvements if you run it as a web service.
- **Can I sell Galaxy Maps hosting?** Yes, but you must publish your modifications under AGPL-3.0.
- **Can I build commercial tools for Galaxy Maps?** Yes! Use Apache 2.0 licensed SDKs and tools.
- **Can I contribute?** Yes! We welcome contributions under the appropriate license.

For specific licensing questions, please open an issue on GitHub or contact the maintainers.

## Resources

- [AGPL-3.0 Full Text](./LICENSE)
- [Apache 2.0 Full Text](./LICENSE-APACHE-2.0)
- [GNU AGPL FAQ](https://www.gnu.org/licenses/gpl-faq.html#AGPLv3)
- [Apache License FAQ](https://www.apache.org/foundation/license-faq.html)
- [Contributing Guidelines](./CONTRIBUTING.md) (if available)

---

**Last Updated:** 2025-01-25
