SELECT FCSFiles.Name, FCSFiles.Run.FilePathRoot || '/' || FCSFiles.Name AS FilePath,
FROM FCSFiles
