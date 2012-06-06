suppressMessages( library(ncdfFlow) );

rootPath <-labkey.url.params$path;

filesArray <- list.files( rootPath, pattern = "*.fcs", full.names=TRUE );

fullPathToCDF <- paste(rootPath,"/fullCDF.cdf",sep="");

#ls.str();

if ( file.exists( fullPathToCDF ) ) {
	txt <- "File already exists, no need to recreate it!";
} else {
	print("READING FILES AND CONVERTING THEM TO A NETCDF FILE")
	system.time(
	flowSetToDisplay <- read.ncdfFlowSet(files = filesArray, ncdfFile = fullPathToCDF, isSaveMeta = TRUE)
	);

	txt <- "File created.";
}

write(txt, file="${txtout:textOutput}");
