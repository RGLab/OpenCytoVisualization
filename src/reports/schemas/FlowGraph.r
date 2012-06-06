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

product <- as.numeric(labkey.url.params$dimension);
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
	cond <- paste(' | ', paste(colNames,collapse='+'), sep='');
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
	dim <- ceiling(sqrt(product));
	if ( product > dim * ( dim - 1 ) ){
		xyplot( argPlot, data=fs, smooth=F, xbin=128 );#, layout=c(dim,dim,1) );
	} else {
		xyplot( argPlot, data=fs, smooth=F, xbin=128 );#, layout=c(dim,dim-1,1) );
	}
}
proc.time() - ptm;

#ls.str()

dev.off();

