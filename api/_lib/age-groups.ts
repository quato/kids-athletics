export const AGE_GROUP_SQL = `
  CASE
    WHEN r.birth_year BETWEEN 2022 AND 2023 THEN '2022-2023'
    WHEN r.birth_year BETWEEN 2020 AND 2021 THEN '2020-2021'
    WHEN r.birth_year BETWEEN 2018 AND 2019 THEN '2018-2019'
    WHEN r.birth_year BETWEEN 2016 AND 2017 THEN '2016-2017'
    WHEN r.birth_year BETWEEN 2014 AND 2015 THEN '2014-2015'
    ELSE 'special'
  END
`;

export const AGE_GROUPS = [
  { key: "2022-2023", label: "2022 – 2023" },
  { key: "2020-2021", label: "2020 – 2021" },
  { key: "2018-2019", label: "2018 – 2019" },
  { key: "2016-2017", label: "2016 – 2017" },
  { key: "2014-2015", label: "2014 – 2015" },
] as const;

export type AgeGroupKey = (typeof AGE_GROUPS)[number]["key"];

export function isKnownAgeGroup(key: string): key is AgeGroupKey {
  return AGE_GROUPS.some((g) => g.key === key);
}
