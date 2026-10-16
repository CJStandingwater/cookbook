export const TAG_SOURCES = [
    "../schema/tags.enum.json",
    "https://raw.githubusercontent.com/CJStandingwater/cookbook/main/schema/tags.enum.json",
];

export const INSTRUCTION_ACTIONS = [
    "assemble",
    "bake",
    "beat",
    "blend",
    "boil",
    "broil",
    "chill",
    "chop",
    "combine",
    "cool",
    "cut",
    "fold",
    "frost",
    "fry",
    "garnish",
    "grill",
    "knead",
    "marinate",
    "melt",
    "mix",
    "preheat",
    "proof",
    "reduce",
    "rest",
    "roast",
    "saute",
    "season",
    "serve",
    "simmer",
    "steam",
    "stir",
    "toast",
    "whisk",
];

export const VOLUME_CONVERSIONS = {
    ml: 1,
    l: 1000,
    tsp: 4.92892159375,
    tbsp: 14.78676478125,
    floz: 29.5735295625,
    cup: 236.5882365,
    pint: 473.176473,
    quart: 946.352946,
};

export const WEIGHT_CONVERSIONS = {
    g: 1,
    kg: 1000,
    oz: 28.349523125,
    lb: 453.59237,
};

const DEFAULT_TOLERANCE = 0.02;
const DEFAULT_PRECISION = 2;

export const COUNT_FORMAT = {
    divisions: new Set([8, 3]),
    tolerance: DEFAULT_TOLERANCE,
    precision: DEFAULT_PRECISION,
};

export const IMPERIAL_VOLUME_UNITS = [
    {
        key: `quart`,
        label: "quart",
        value: VOLUME_CONVERSIONS.quart,
        min: 1,
        max: Infinity,
        divisions: new Set([4]),
        tolerance: 0.054,
        precision: DEFAULT_PRECISION,
    },
    {
        key: `pint`,
        label: "pint",
        value: VOLUME_CONVERSIONS.pint,
        min: 1,
        max: Infinity,
        divisions: new Set([4]),
        tolerance: DEFAULT_TOLERANCE,
        precision: DEFAULT_PRECISION,
    },
    {
        key: "cup",
        label: "cup",
        value: VOLUME_CONVERSIONS.cup,
        min: 0.125,
        max: 4,
        divisions: new Set([8, 3]),
        tolerance: DEFAULT_TOLERANCE,
        precision: DEFAULT_PRECISION,
    },
    {
        key: "floz",
        label: "fl oz",
        value: VOLUME_CONVERSIONS.floz,
        min: 1,
        max: 8,
        divisions: new Set([4]),
        tolerance: DEFAULT_TOLERANCE,
        precision: DEFAULT_PRECISION,
    },
    {
        key: "tbsp",
        label: "tbsp",
        value: VOLUME_CONVERSIONS.tbsp,
        min: 1,
        max: 4,
        divisions: new Set([4]),
        tolerance: DEFAULT_TOLERANCE,
        precision: DEFAULT_PRECISION,
    },
    {
        key: "tsp",
        label: "tsp",
        value: VOLUME_CONVERSIONS.tsp,
        min: 0,
        max: 3,
        divisions: new Set([4]),
        tolerance: DEFAULT_TOLERANCE,
        precision: DEFAULT_PRECISION,
    },
];

export const IMPERIAL_WEIGHT_UNITS = [
    {
        key: "lb",
        label: "lb",
        value: WEIGHT_CONVERSIONS.lb,
        min: 0.125,
        max: 5,
        divisions: new Set([8, 4]),
        tolerance: DEFAULT_TOLERANCE,
        precision: DEFAULT_PRECISION,
    },
    {
        key: "oz",
        label: "oz",
        value: WEIGHT_CONVERSIONS.oz,
        min: 0.25,
        max: 16,
        divisions: new Set([4]),
        tolerance: DEFAULT_TOLERANCE,
        precision: DEFAULT_PRECISION,
    },
];

export const METRIC_VOLUME_UNITS = [
    {
        key: "l",
        label: "L",
        value: VOLUME_CONVERSIONS.l,
        min: 1,
        max: Infinity,
        increment: 0.05,
        tolerance: DEFAULT_TOLERANCE,
        precision: DEFAULT_PRECISION,
    },
    {
        key: "ml",
        label: "mL",
        value: VOLUME_CONVERSIONS.ml,
        min: 1,
        max: 1000,
        increment: 5,
        tolerance: DEFAULT_TOLERANCE,
        precision: 0,
    },
];

export const METRIC_WEIGHT_UNITS = [
    {
        key: "kg",
        label: "kg",
        value: WEIGHT_CONVERSIONS.kg,
        min: 1,
        max: Infinity,
        increment: 0.05,
        tolerance: DEFAULT_TOLERANCE,
        precision: DEFAULT_PRECISION,
    },
    {
        key: "g",
        label: "g",
        value: WEIGHT_CONVERSIONS.g,
        min: 1,
        max: 1000,
        increment: 5,
        tolerance: DEFAULT_TOLERANCE,
        precision: 0,
    },
];
