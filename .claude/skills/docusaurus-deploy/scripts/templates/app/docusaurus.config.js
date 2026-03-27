/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "LearnFlow Docs",
  tagline: "AI-Powered Python Tutoring Platform",
  url: "http://localhost:4000",
  baseUrl: "/",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "LearnFlow",
        items: [
          { type: "docSidebar", sidebarId: "docs", position: "left", label: "Docs" },
        ],
      },
      footer: {
        style: "dark",
        copyright: `Built with Skills + MCP Code Execution | LearnFlow ${new Date().getFullYear()}`,
      },
    }),
};

module.exports = config;
