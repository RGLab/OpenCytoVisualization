imageWidth <- as.numeric(labkey.url.params$imageWidth);

print('LOADING LIBRARIES');
ptm <- proc.time();

library(Cairo);
CairoPNG(filename='${imgout:Graph.png}', width=3/4*imageWidth, height=3/4*imageWidth);

# png(filename='${imgout:Graph.png}', type='cairo-png') #, width=700, height=300)

suppressMessages( library(ncdfFlow) );
suppressMessages( library(flowViz) );

proc.time() - ptm;

product <- as.numeric(labkey.url.params$dimension);
bin <- as.numeric(labkey.url.params$bin);
bin <- 256;
xAxis <- labkey.url.params$xAxis;
yAxis <- labkey.url.params$yAxis;
filesNames <- labkey.url.params$filesNames;
rootPath <-labkey.url.params$path;
studyVars <- labkey.url.params$studyVars;
if ( labkey.url.params$flagEnableGrouping == 'YES' ){
	separator <- '+';
} else{
	separator <- ':';
}

filesArray <- unlist(strsplit(filesNames, split=','));
studyVarsArray <- unlist(strsplit(studyVars, split=';'));
colNames <- sub(' ', '_', studyVarsArray);

fullPathToCDF <- paste(rootPath,'/fullCDF.cdf',sep='');

suppressWarnings( flowSetToDisplay <- ncdfFlowSet_open( fullPathToCDF ) );

# flowSetToDisplay <- read.flowSet(files = filesArray, phenoData = list( Sample_Order = 'Sample Order', Replicate = 'Replicate' ) )

fs <- flowSetToDisplay[ filesArray ];

print('CONVERTING');
system.time(
fs <- NcdfFlowSetToFlowSet( fs )
);

studyVarsList <- list();
studyVarsList <- c(studyVarsList, studyVarsArray);
names(studyVarsList) <- colNames;
studyVarsList <- c(list(name='$FIL'),studyVarsList);

if (labkey.url.params$flagAppendFileName == 'NO' ){
	cond <- '';
} else{
	cond <- paste('name',separator);
}
if ( length(colNames) > 0 ){
	cond <- paste(' | ',cond, paste(colNames,collapse=separator), sep='');
}
pData(fs) <- as.data.frame( keyword( fs, studyVarsList ) );

print('PLOTTING');
ptm <- proc.time();
if ( xAxis == 'Time' ){
	timeLinePlot( fs, yAxis );
} else if ( yAxis == '' ){
	argPlot <- as.formula( paste('~ `',xAxis,'`',sep='') )
	densityplot( argPlot, fs );
} else{

	argPlot <- as.formula( paste('`',yAxis,'` ~  `',xAxis,'`',cond,sep='') );
    dim <- ceiling(sqrt(product));
    if ( product > dim * ( dim - 1 ) ){
        layoutArg <- c(dim,dim,1);
    } else{
        layoutArg <- c(dim,dim-1,1);
    }

    xFlag <- FALSE; yFlag <- FALSE;

	if ( grepl('FSC', xAxis, fixed=T) | grepl('SSC', xAxis, fixed=T) ){
	    xFlag <- TRUE;
    }
    if ( grepl('FSC', yAxis, fixed=T) | grepl('SSC', yAxis, fixed=T) ){
	    yFlag <- TRUE;
	}

    if ( xFlag & yFlag ){
        xyplot( argPlot, data=fs, smooth=F, xbin=bin, layout=layoutArg, xlab=labkey.url.params$xLab, ylab=labkey.url.params$yLab );
    } else{
        if ( xFlag & !(yFlag) ){
            trans <- estimateLogicle( x=fs[[1]], channels=c(yAxis) );
        } else if ( !(xFlag) & yFlag ){
            trans <- estimateLogicle( x=fs[[1]], channels=c(xAxis) );
        } else{
        	trans <- estimateLogicle( x=fs[[1]], channels=c(xAxis, yAxis) );
        }
       	xyplot( argPlot, data=transform(fs,trans), smooth=F, xbin=bin, layout=layoutArg, xlab=labkey.url.params$xLab, ylab=labkey.url.params$yLab );
    }

}

proc.time() - ptm;

ls.str()

dev.off();

