const scopeMatchesStartsWith = (sw, s) => {
  if (sw.length === 0) {
    return true;
  }

  for (const swv of sw) {
    if (s.startsWith(swv)) {
      return true;
    }
  }
  return false;
};

const itemSchemaString = `
"""Item"""
type Item {
  """The basic item type (token, scope or graft)"""
  type: String!
  """The type-dependent subtype of the item"""
  subType: String!
  """The content of the item (the text for tokens, the label for scopes and the sequence id for grafts)"""
  payload(
    """If true, turn all whitespace into a normal space"""
    normalizeSpace: Boolean
    """A whitelist of characters to include"""
    includeChars: [String!]
    """A blacklist of characters to exclude"""
    excludeChars: [String!],
  ): String!
  """If 'includeContext' was selected, and for tokens, the index of the token from the start of the sequence"""
  position(
    """Only include scopes that begin with this value"""
    startsWith: [String!]
  ): Int
  """If 'includeContext' was selected, a list of scopes that are open around the item"""
  scopes(
    """Only include scopes that begin with this value"""
    startsWith: [String!]
  ): [String!]
}
`;

const itemResolvers = {
  type: root => root[0],
  subType: root => root[1],
  payload: (root, args) => {
    let ret = root[2];

    if (root[0] === 'token') {
      if (args.normalizeSpace) {
        ret = root[2].replace(/[ \t\n\r]+/g, ' ');
      }

      if (args.includeChars || args.excludeChars) {
        let retArray = ret.split('');
        retArray = retArray.filter(c => !args.includeChars || args.includeChars.includes(c));
        retArray = retArray.filter(c => !args.excludeChars || !args.excludeChars.includes(c));
        ret = retArray.join('');
      }
    }
    return ret;
  },
  position: root => root[3],
  scopes: (root, args) =>
    root[4] ? root[4].filter(s => !args.startsWith || scopeMatchesStartsWith(args.startsWith, s)) : [],
};

export {
  itemSchemaString,
  itemResolvers,
};
