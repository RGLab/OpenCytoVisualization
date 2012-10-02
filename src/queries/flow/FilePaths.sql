SELECT
 FCSFiles.Name AS FileName,
 FCSFiles.Run.FilePathRoot || '/' || FCSFiles.Name AS FilePath
FROM
 FCSFiles
