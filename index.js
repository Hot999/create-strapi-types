const { readdirSync } = require("fs");
const path = require("path");
const { defaultTypes } = require("./lib/default-types");
const {
  createFile,
  createObjectAttributes,
  createTypesContent,
  getJsonFileContent,
  getPathToRoot,
  toPascalCase,
} = require("./lib/functions");

const rootPath = getPathToRoot();
const pathAPI = path.join(rootPath, "/src/api");
const pathComponents = path.join(rootPath, "/src/components");
const pathBackendTypes = path.join(rootPath, "/types");
const pathFrontendTypes = path.join(rootPath, "../frontend/src/types");
const API_PREFIX = "API";

const createMainTypes = (items) => {
  try {
    readdirSync(pathAPI).forEach(async (file) => {
      if (file.startsWith(".")) {
        return;
      }
      try {
        const fileJson = getJsonFileContent(
          path.join(pathAPI, `/${file}/content-types/${file}/schema.json`)
        );

        const tsAttributes = {
          nameTs: `${API_PREFIX}${toPascalCase(`${fileJson.info.singularName}`)}`,
          id: "number",
        };

        createObjectAttributes(tsAttributes, fileJson.attributes);

        items.push(tsAttributes);
      } catch (error) {}
    });

    const strTypes = createTypesContent(items);

    return strTypes;
  } catch (error) {
    console.log(error);
    return "";
  }
};

const createComponentsTypes = (items) => {
  readdirSync(pathComponents).forEach(async (file) => {
    if (file.startsWith(".")) {
      return;
    }
    readdirSync(path.join(pathComponents, `/${file}`)).forEach((fileEntry) => {
      const isJSON = fileEntry.split(".")[1] === "json";
      if (!isJSON) {
        return;
      }

      const fileJson = getJsonFileContent(
        path.join(pathComponents, `/${file}/${fileEntry}`)
      );

      const fileName = path.parse(fileEntry).name;
      const addS = fileName[fileName?.length - 1] === "s" ? "" : "s";
      const modelName = toPascalCase(`Components.${file}.${fileName}${addS}`);

      const tsAttributes = {
        nameTs: modelName,
        id: "number",
      };

      try {
        createObjectAttributes(tsAttributes, fileJson.attributes);
        items.push(tsAttributes);
      } catch (error) {
        console.log(error);
      }
    });
  });

  const strTypes = createTypesContent(items);

  return strTypes;
};

const create = (hasFrontend) => {
  const items = [];
  const fileMainContent = createMainTypes(items);
  const fileComponentsContent = createComponentsTypes(items);
  const fileContent = fileMainContent + fileComponentsContent + defaultTypes;

  createFile(pathBackendTypes, "types.ts", fileContent, "backend");

  if (hasFrontend) {
    createFile(pathFrontendTypes, "types.ts", fileContent, "frontend");
  }
};

module.exports = {
  create,
};
