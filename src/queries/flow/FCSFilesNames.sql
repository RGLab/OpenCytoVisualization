SELECT DISTINCT FCSFiles.Name AS FCSFileName
FROM FCSFiles
WHERE FCSFiles.Run."Analysis Folder"."Flow Experiment Runs" = true
ORDER BY FCSFileName
