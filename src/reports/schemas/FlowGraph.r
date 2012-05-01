library(Cairo)
CairoPNG(filename="${imgout:Graph.png}") #, width=700, height=300)

# png(filename="${imgout:Graph.png}", type="cairo-png") #, width=700, height=300)

# suppressMessages( library(flowCore) )

print("load flowViz")
system.time(
suppressMessages( library(flowViz) )
)

xAxis <- labkey.url.params$xAxis;
yAxis <- labkey.url.params$yAxis;
listOfFilesNames <- labkey.url.params$filesNames;
rootPath <-labkey.url.params$path;

filesArray <- unlist(strsplit(listOfFilesNames, split=","));

print("READING FILES")
system.time(
flowSetToDisplay <- read.flowSet(files = filesArray, path = rootPath)
)
# flowSetToDisplay <- read.flowSet(files = filesArray, phenoData = list( Stim = 'Stim', SampleOrder = 'Sample Order', Replicate = 'Replicate' ) )

if ( xAxis == "Time" ){
	timeLinePlot( flowSetToDisplay, yAxis);
} else if ( yAxis == "" ){
	argPlot <- as.formula( paste("~ `",xAxis,"`",sep="") ) 
	densityplot( argPlot, flowSetToDisplay );
} else {
	argPlot <- as.formula( paste("`",yAxis,"` ~  `",xAxis,"`",sep="") );
ptm <- proc.time()
	xyplot( argPlot, flowSetToDisplay );
}

# ls.str()

proc.time() - ptm

dev.off()

