const fs = require("fs");
const prettier = require("prettier");
const path = require("path");

const toPascalCase = (string) => {
  return string
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
    .join("");
};

const getTypeTs = (element) => {
  const API_PREFIX = "API";
  if (
    ["uid", "text", "richtext", "email", "time"].includes(element?.type) ||
    element.customField
  ) {
    return "string";
  }
  if (element.type === "date") {
    return "Date";
  }
  if (element.type === "dynamiczone") {
    return "any";
  }
  if (element.type === "enumeration") {
    return element?.enum?.map((el) => `"${el}"`).join(" | ");
  }
  if (element.type === "json") {
    return "JSON";
  }
  if (["decimal", "float", "integer", "biginteger"].includes(element?.type)) {
    return "number";
  }
  if (element.type === "component") {
    const compName = toPascalCase(element.component);
    const addSLastLetter = compName[compName.length - 1] === "s" ? "" : "s";
    const isRepeatable = element?.repeatable ? "[]" : "";
    return `Components${compName}${addSLastLetter}${isRepeatable}`;
  }
  if (element?.type === "relation") {
    const compName = element.target.split(".")[1];
    const isRepeatable = ["oneToMany", "manyToMany"]?.includes(
      element?.relation
    )
      ? "[]"
      : "";
    return `${API_PREFIX}${toPascalCase(compName)}${isRepeatable}`;
  }

  if (element?.type === "media") {
    const isMultiple = element?.multiple ? "[]" : "";
    return `${"Media"}${isMultiple}`;
  }
  return element?.type;
};

const getJsonFileContent = (path) => {
  const fileSchema = fs.readFileSync(path, "utf8");
  const fileJson = JSON.parse(fileSchema);

  return fileJson;
};

const createObjectAttributes = (obj, attributes) => {
  for (const key in attributes) {
    if (Object.hasOwnProperty.call(attributes, key)) {
      const element = attributes[key];
      obj[key] = getTypeTs(element);
    }
  }
};

const createTypesContent = (items) => {
  let fileStr = "";
  items.map((el) => {
    let content = ``;
    const dataItems = { ...el };
    delete dataItems.nameTs;
    for (const key in dataItems) {
      if (Object.hasOwnProperty.call(el, key)) {
        const element = el[key];
        content += `${key}: ${element.replaceAll("'", "")};`;
      }
    }
    fileStr += `export interface ${el.nameTs} {${content}}
    
    `;
  });
  return fileStr;
};

const createFile = async (pathToDir, fileName, fileContent, type) => {
  const str = await prettier.format(fileContent, {
    semi: false,
    parser: "babel",
  });

  if (!fs.existsSync(pathToDir)) {
    fs.mkdirSync(pathToDir);
  }

  fs.writeFile(path.join(pathToDir, fileName), str, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`created file for ${type}`, path.join(pathToDir, fileName));
    }
  });
};

const getPathToRoot = () => {
  return path.join(__dirname, "../../../");
};

module.exports = {
  toPascalCase,
  getTypeTs,
  getJsonFileContent,
  createObjectAttributes,
  createTypesContent,
  createFile,
  getPathToRoot,
};
