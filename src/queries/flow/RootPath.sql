SELECT
 DISTINCT FCSFiles.Run.FilePathRoot AS RootPath
FROM
 FCSFiles
WHERE
 FCSFiles.Run.FilePathRoot IS NOT NULL