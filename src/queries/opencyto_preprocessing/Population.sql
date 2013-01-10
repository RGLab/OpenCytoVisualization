SELECT DISTINCT
 projections.path AS path
, projections.name AS name
, projections.gsid.gsname AS analysis
FROM
 projections
ORDER BY
 projections.path