const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

const matchBackend = __dirname.match("/backend/");

const getPathToSrc = () => {
  if (matchBackend) {
    return `${__dirname.slice(0, matchBackend.index)}/backend/src`;
  }
  return __dirname;
};
const getPathToFrontend = () => {
  if (matchBackend) {
    return `${__dirname.slice(0, matchBackend.index)}/frontend/src/types`;
  }
  return __dirname;
};

const pathToSrc = getPathToSrc();
const pathToFrontend = getPathToFrontend();
const apiFolder = path.join(pathToSrc, "/api");
const componentsFolder = path.join(pathToSrc, "/components");
const API_PREFIX = "API";

const typeMedia = `
export interface Media {
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
}

export interface APIResponseCollectionMetadata {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

export interface APIResponse<T> {
  data: T;
}

export interface APIResponseCollection<T> {
  data: T[];
  meta: APIResponseCollectionMetadata;
}
`;

function toPascalCase(string) {
  return string
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
    .join("");
}

const createFile = async (fileContent) => {
  const str = await prettier.format(fileContent, {
    semi: false,
    parser: "babel",
  });
  fs.writeFile(path.join(__dirname, "types.ts"), str, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Create types for backend");
    }
  });

  // добавить типы к фронту
  if (!fs.existsSync(pathToFrontend)) {
    fs.mkdirSync(pathToFrontend);
  }

  fs.writeFile(path.join(pathToFrontend, `/types.ts`), str, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Create types for frontend");
    }
  });
};

const getTypeTs = (element) => {
  if (
    element?.type === "uid" ||
    element.type === "text" ||
    element.type === "richtext" ||
    element.type === "email" ||
    element.type === "time" ||
    element.customField
  ) {
    return "string";
  }
  if (element?.type === "date") {
    return "Date";
  }
  if (element?.type === "dynamiczone") {
    // если надо то можно что то придумать с компонентами
    // const components = element?.components
    //   ?.map((el) => `Components${toPascalCase(el)}s`)
    //   ?.join(" | ");
    return "any";
  }
  if (element?.type === "enumeration") {
    return element?.enum?.map((el) => `"${el}"`).join(" | ");
  }
  if (element?.type === "json") {
    return "JSON";
  }
  if (
    element?.type === "decimal" ||
    element.type === "float" ||
    element.type === "integer"
  ) {
    return "number";
  }
  if (element.type === "component") {
    const name = toPascalCase(element.component);
    const lastS = name[name.length - 1] === "s" ? "" : "s";
    const isRepeat = element?.repeatable ? "[]" : "";
    return `Components${name}${lastS}${isRepeat}`;
  }
  if (element?.type === "relation") {
    const name = element.target.split(".")[1];
    const isRepeat = ["oneToMany", "manyToMany"]?.includes(element?.relation)
      ? "[]"
      : "";
    return `${API_PREFIX}${toPascalCase(name)}${isRepeat}`;
  }

  if (element?.type === "media") {
    const isRepeat = element?.multiple ? "[]" : "";
    return `${"Media"}${isRepeat}`;
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

const items = [];
let fileContent = "";

const createMainTypes = () => {
  fs.readdirSync(apiFolder).forEach(async (file) => {
    if (file.startsWith(".")) {
      return;
    }
    try {
      const fileJson = getJsonFileContent(
        path.join(pathToSrc, `/api/${file}/content-types/${file}/schema.json`)
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
  fileContent += strTypes;
};

const createComponentsTypes = () => {
  fs.readdirSync(componentsFolder).forEach(async (file) => {
    if (file.startsWith(".")) {
      return;
    }
    fs.readdirSync(path.join(pathToSrc, "/components", `/${file}`)).forEach(
      (fileEntry) => {
        const isJSON = fileEntry.split(".")[1] === "json";
        if (!isJSON) {
          return;
        }

        const fileJson = getJsonFileContent(
          path.join(pathToSrc, `/components/${file}/${fileEntry}`)
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
      }
    );
  });

  const strTypes = createTypesContent(items);
  fileContent += strTypes;
};

// createMainTypes();
// createComponentsTypes();
// createFile((fileContent += typeMedia));

module.exports = {
  crateTypes: () => {
    createMainTypes();
    createComponentsTypes();
    createFile((fileContent += typeMedia));
  },
};
