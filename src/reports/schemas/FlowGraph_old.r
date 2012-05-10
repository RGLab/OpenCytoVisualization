library(Cairo)
CairoPNG(filename="${imgout:Graph.png}") #, width=700, height=300)

# png(filename="${imgout:Graph.png}", type="cairo-png") #, width=700, height=300)

# suppressMessages( library(flowCore) )

print("LOADING flowViz")
system.time(
suppressMessages( library(flowViz) )
)

xAxis <- labkey.url.params$xAxis;
yAxis <- labkey.url.params$yAxis;
listOfFilesNames <- labkey.url.params$filesNames;
rootPath <-labkey.url.params$path;

filesArray <- unlist(strsplit(listOfFilesNames, split=","));

print("READING IN FCS FILES")
system.time(
suppressWarnings( flowSetToDisplay <- read.flowSet(files = filesArray, path = rootPath) )
)
# flowSetToDisplay <- read.flowSet(files = filesArray, phenoData = list( Stim = 'Stim', SampleOrder = 'Sample Order', Replicate = 'Replicate' ) )

if ( xAxis == "Time" ){
ptm <- proc.time()
	timeLinePlot( flowSetToDisplay, yAxis);
} else if ( yAxis == "" ){
	argPlot <- as.formula( paste("~ `",xAxis,"`",sep="") ) 
ptm <- proc.time()
	densityplot( argPlot, flowSetToDisplay );
} else {
	argPlot <- as.formula( paste("`",yAxis,"` ~  `",xAxis,"`",sep="") );
ptm <- proc.time()
	xyplot( argPlot, flowSetToDisplay );
}

# ls.str()
print("PLOTTING")
proc.time() - ptm

dev.off()

