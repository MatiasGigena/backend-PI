const { Recipe, Diet } = require("../db");
const process = require('process');
const axios = require("axios");
const { Op } = require("sequelize");

const cleanArray = (arr) =>
  //Limpiar el array, me quedo con solo lo que necesito.
  arr.map((elm) => {
    return {
      id: elm.id,
      name: elm.title,
      image: elm.image,
      healthScore: elm.healthScore,
      diets: elm.diets.map((e) => e + "--"),
      createdInDb: elm.createdInDb,
    };
  });
const cleanArrayID = (arr) =>
  arr.map((elm) => {
    let step = elm.analyzedInstructions.map((a) => {
      return a.steps.map((as) => {
        return `Step ${as.number}: ${as.step}.`;
      });
    });
    return {
      id: elm.id,
      name: elm.title,
      summary: elm.summary.replace(/<[^>]+>/g, ""), //Elimino guiones, barras y letras xtra por espacios sin strings vacios
      image: elm.image,
      healthScore: elm.healthScore,
      stepByStep: step[0],
      diets: elm.diets.map((e) => e + "--"),
      createdInDb: elm.createdInDb,
    };
  });

const searchRecipeByName = async (name) => {
  const databaseRecipe = await Recipe.findAll({
    where: { name: { [Op.iLike]: `%${name}%` } },
    include: {
      model: Diet,
      attributes: ["name"],
      through: {
        attributes: [],
      },
    },
  });

  let success = false;
    let attempts = 0;
    let apiRecipe;
  
    while (!success && attempts < 10) {
      try {
        const apiKey = process.env[`API_KEY${attempts + 1}`];
        apiRecipe = (
          await axios.get(
            `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&number=100&addRecipeInformation=true`
          )
        ).data;
        success = true;
      } catch (error) {
        attempts++;
      }
    }
  
    if (!success) {
      throw new Error('No se pudo obtener datos de la API después de intentar con todas las claves de API');
    }
  const newApi = cleanArray(apiRecipe.results);

  const filteredApi = newApi.filter((recipe) =>
    recipe.name.toLocaleLowerCase().includes(name.toLocaleLowerCase())
  );

  return [...databaseRecipe, ...filteredApi];
};

const getAllRecipes = async () => {
  const databaseRecipe = await Recipe.findAll({
    include: {
      model: Diet,
      attributes: ["name"],
      through: {
        attributes: [],
      },
    },
  });

  let success = false;
    let attempts = 0;
    let apiRecipe;
  
    while (!success && attempts < 10) {
      try {
        const apiKey = process.env[`API_KEY${attempts + 1}`];
        apiRecipe = (
          await axios.get(
            `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&number=100&addRecipeInformation=true`
          )
        ).data;
        success = true;
      } catch (error) {
        attempts++;
      }
    }
  
    if (!success) {
      throw new Error('No se pudo obtener datos de la API después de intentar con todas las claves de API');
    }
  const newApi = cleanArray(apiRecipe.results);
  return [...databaseRecipe, ...newApi];
};

const createController = async (
  name,
  summary,
  image,
  stepByStep,
  healthScore,
  diets
) => {
  const nRecipe = await Recipe.create({
    name,
    summary,
    image,
    stepByStep,
    healthScore,
  });
  diets.map(async (diet) => await nRecipe.addDiet(diet));
  return nRecipe;
};

const getRecipeById = async (id, source) => {
  let recipe;

  if (source === "api") {
    let success = false;
    let attempts = 0;

    while (!success && attempts < 10) {
      try {
        const apiKey = process.env[`API_KEY${attempts + 1}`];
        recipe = (
          await axios.get(
            `https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`
          )
        ).data;
        success = true;
      } catch (error) {
        attempts++;
      }
    }

    if (!success) {
      throw new Error('No se pudo obtener datos de la API después de intentar con todas las claves de API');
    }

    recipe = cleanArrayID([recipe]);
  } else {
    recipe = await Recipe.findByPk(id);
  }

  return recipe;
};
module.exports = {
  createController,
  getRecipeById,
  searchRecipeByName,
  getAllRecipes,
};
