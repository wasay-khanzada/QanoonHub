const fs = require("fs");
const path = require("path");

function loadTemplate(documentType) {
  const filePath = path.join(
    __dirname,
    "documentTemplates",
    `${documentType}.json`
  );

  if (!fs.existsSync(filePath)) {
    throw new Error("Template not found");
  }

  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function fillTemplate(templateText, data) {
  return templateText.replace(/{{(.*?)}}/g, (match, key) => {
    return data[key.trim()] || "";
  });
}

module.exports = { loadTemplate, fillTemplate };
