SELECT DISTINCT FCSFiles.Name AS FileName
FROM FCSFiles
WHERE FCSFiles.Run."Analysis Folder"."Flow Experiment Runs" = true
ORDER BY FileName
