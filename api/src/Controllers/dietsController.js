const { Diet } = require("../db");
const axios = require("axios");
const process = require('process');

const cleanArray = (arr) =>
  arr.map((e) => {
    return {
      diets: e.diets.map((diet) => diet + "--"),
    };
  });

  const getAllDiets = async () => {
    let success = false;
    let attempts = 0;
    let apiResponse;
  
    while (!success && attempts < 10) {
      try {
        const apiKey = process.env[`API_KEY${attempts + 1}`];
        apiResponse = (
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

  const newApi = cleanArray(apiResponse.results);

  // Obtener nombres de dietas únicos
  const dietNames = new Set();
  newApi.forEach((item) => {
    item.diets.forEach((diet) => {
      dietNames.add(diet);
      dietNames.add("vegetarian--");
    });
  });

  const uniqueDietNames = [...dietNames];

  for (const dietName of uniqueDietNames) {
    await Diet.findOrCreate({
      where: { name: dietName },
    });
  }

  const databaseDiets = await Diet.findAll();
  return databaseDiets;
};

module.exports = {
  getAllDiets,
};
