import { Plugin } from "vite";

const lovableTagger = (): Plugin => {
  return {
    name: "lovable-tagger-plugin",
    transform(code, id) {
      console.log("Transforming:", id);
      return code;
    },
  };
};

export default lovableTagger;