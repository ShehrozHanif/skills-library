/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    "intro",
    "getting-started",
    {
      type: "category",
      label: "Skills",
      items: [
        "skills/overview",
        "skills/kafka-setup",
        "skills/postgres-setup",
        "skills/backend-services",
        "skills/frontend",
        "skills/mcp-integration",
      ],
    },
    {
      type: "category",
      label: "Architecture",
      items: ["architecture/overview", "architecture/deployment"],
    },
  ],
};

module.exports = sidebars;
