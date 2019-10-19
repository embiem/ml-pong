import { DecisionTreeRegression as DTRegression } from "ml-cart";
import { RandomForestRegression as RFRegression } from "ml-random-forest";

function trainDecisionTree(x, y) {
  const dtRegModel = new DTRegression({
    maxDepth: Infinity,
    minNumSamples: 3
  });
  dtRegModel.train(x, y);
  
  console.info("Decision Tree trained!");
  return dtRegModel;
}

function trainRandomForest(x, y) {
  const rfRegModel = new RFRegression({
    maxFeatures: 1.0,
    nEstimators: 10,
    replacement: true,
    selectionMethod: "mean",
    treeOptions: {
      maxDepth: Infinity,
      minNumSamples: 3
    }
  });
  rfRegModel.train(x, y);

  console.info("Random Forest trained!");
  return rfRegModel;
}

// ===> Switch the model here
export default function trainModel(x, y) {
  return trainDecisionTree(x, y);
}