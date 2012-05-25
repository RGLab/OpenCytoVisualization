SELECT DISTINCT FCSFiles.Name AS FileName, FCSFiles.Keyword."Replicate" AS Replicate
FROM FCSFiles
WHERE FCSFiles.Run."Analysis Folder"."Flow Experiment Runs" = true AND FCSFiles.Keyword."Replicate" != ''
ORDER BY FileName

-- SELECT DISTINCT FCSFiles.Name AS FileName,
-- FROM FCSFiles
-- WHERE FCSFiles.Run."Analysis Folder"."Flow Experiment Runs" = true
-- ORDER BY FileName
