imageWidth <- as.numeric(labkey.url.params$imageWidth);

#ls.str();

print('LOADING LIBRARIES');
ptm <- proc.time();

library(Cairo);
CairoPNG(filename='${imgout:Graph.png}', width=imageWidth, height=imageWidth);

# png(filename='${imgout:Graph.png}', type='cairo-png') #, width=700, height=300)

suppressMessages( library(ncdfFlow) );
suppressMessages( library(flowViz) );

proc.time() - ptm;

xAxis <- labkey.url.params$xAxis;
yAxis <- labkey.url.params$yAxis;
filesNames <- labkey.url.params$filesNames;
rootPath <-labkey.url.params$path;
keywords <- labkey.url.params$keywords;

filesArray <- unlist(strsplit(filesNames, split=','));
keywordsArray <- unlist(strsplit(keywords, split=';'));
colNames <- sub(' ', '_', keywordsArray);

fullPathToCDF <- paste(rootPath,'/fullCDF.cdf',sep='');

suppressWarnings( flowSetToDisplay <- ncdfFlowSet_open( fullPathToCDF ) );

# flowSetToDisplay <- read.flowSet(files = filesArray, phenoData = list( Sample_Order = 'Sample Order', Replicate = 'Replicate' ) )

fs <- flowSetToDisplay[ filesArray ];

print('CONVERTING');
system.time(
fs <- NcdfFlowSetToFlowSet( fs )
);

keywordsList <- list();
keywordsList <- c(keywordsList, keywordsArray);
names(keywordsList) <- colNames;
keywordsList <- c(list(name='$FIL'),keywordsList);

cond <- '';
if ( length(colNames) > 0 ){
	cond <- paste(' | ', paste(colNames,collapse=':'), ':name', sep='');
}
pData(fs) <- as.data.frame( keyword( fs, keywordsList ) );

print('PLOTTING');
ptm <- proc.time();
if ( xAxis == 'Time' ){
	timeLinePlot( fs, yAxis);
} else if ( yAxis == '' ){
	argPlot <- as.formula( paste('~ `',xAxis,'`',sep='') )
	densityplot( argPlot, fs );
} else {
	argPlot <- as.formula( paste('`',yAxis,'` ~  `',xAxis,'`',cond,sep='') );
	xyplot( argPlot, fs, smooth=F, xbin=64 );
}
proc.time() - ptm;

#ls.str()

dev.off();

