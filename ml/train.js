import { DecisionTreeRegression as DTRegression } from "ml-cart";
import { RandomForestRegression as RFRegression } from "ml-random-forest";

function trainDecisionTree(x, y) {
  const dtRegModel = new DTRegression({
    maxDepth: 6, // Also show Infinity (which is the default)
    minNumSamples: 3
  });
  dtRegModel.train(x, y);

  console.info("Decision Tree trained!");
  return dtRegModel;
}

// ===> Switch the model here
export default function trainModel(x, y) {
  return trainDecisionTree(x, y);
}
