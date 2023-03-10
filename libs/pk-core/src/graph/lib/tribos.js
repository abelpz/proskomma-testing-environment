import xre from 'xregexp';

import { expressions, doPredicate } from './tribos_expression';
import { stepActions } from './tribos_step';

class Tribos {
  constructor() {
    this.currentStepType = null;
  }

  doStep(docSet, allNodes, nodeLookup, result, queryStep) {
    for (const stepAction of stepActions) {
      const matches = xre.exec(queryStep, stepAction.regex);

      if (matches && stepAction.inputType === this.currentStepType) {
        let ret = stepAction.function(docSet, allNodes, nodeLookup, result, queryStep, matches);

        if (matches[stepAction.predicateCapture]) {
          ret = doPredicate(docSet, ret, matches[stepAction.predicateCapture]);
        }
        this.currentStepType = stepAction.outputType;
        return ret;
      }
    }
    return { errors: `Unable to match step ${queryStep}` };
  }

  parse1(docSet, allNodes, nodeLookup, result, queryArray) {
    if (queryArray.length > 0) {
      const stepResult = this.doStep(docSet, allNodes, nodeLookup, result, queryArray[0]);

      if (stepResult.errors || stepResult.data.length === 0) {
        return stepResult;
      } else {
        return this.parse1(docSet, allNodes, nodeLookup, stepResult, queryArray.slice(1));
      }
    } else {
      return result;
    }
  }

  queryArray(qs) {
    const ret = [];

    for (const s of qs.split('/')) {
      ret.push(s);
    }
    return ret;
  }

  indexNodes(docSet, nodes) {
    const ret = new Map();

    for (const [n, node] of nodes.entries()) {
      const nodeId = docSet.unsuccinctifyScopes(node.bs)[0][2].split('/')[1];
      ret.set(nodeId, n);
    }
    return ret;
  }

  doc() {
    return '** Steps **\n\n' +
    stepActions
      .map(sa => sa.doc)
      .map(d => `* ${d.title} *\n${d.syntax}\n${d.description}`)
      .join('\n\n') +
      '** Predicate Operators **\n\n' +
      Object.values(expressions)
        .filter(e => e.doc)
        .map(e => `${e.doc.operator}(${e.doc.args.map(a => '<' + a + '>').join(', ')}) => ${e.doc.result}\n${e.doc.description}`)
        .join('\n\n');
  }

  parse(docSet, nodes, queryString) {
    // console.log(`\n===> ${queryString}\n`);
    const result = this.parse1(
      docSet,
      nodes,
      this.indexNodes(docSet, nodes),
      { data: nodes },
      this.queryArray(queryString),
    );

    if (result.data) {
      switch (this.currentStepType) {
      case 'nodes':
        result.data = result.data.map(n => ({ id: docSet.unsuccinctifyScopes(n.bs)[0][2].split('/')[1] }));
      }
    }

    const ret = JSON.stringify(result, null, 2);
    // console.log(`${ret}\n`);
    return ret;
  }
}

export default Tribos;
