print( 'LOADING LIBRARIES' );
ptm <- proc.time();

suppressMessages( library( Cairo ) );
suppressMessages( library( ncdfFlow ) );
suppressMessages( library( flowViz ) );
suppressMessages( library( flowWorkspace ) );
suppressMessages( library( Rlabkey ) );

imageWidth      <- as.numeric(labkey.url.params$imageWidth);
product         <- as.numeric(labkey.url.params$dimension);
bin             <- as.numeric(labkey.url.params$bin);
bin <- 256; # temp will be replaced by the above
xAxis           <- labkey.url.params$xAxis;
yAxis           <- labkey.url.params$yAxis;
filesString     <- labkey.url.params$filesNames;
rootPath        <- labkey.url.params$path;
studyVarsString <- labkey.url.params$studyVars;

population      <- labkey.url.params$population;

if ( labkey.url.params$flagEnableGrouping == 'YES' ){
    separator <- '+';
} else{
    separator <- ':';
}

if ( labkey.url.params$flagAppendFileName == 'NO' ){
    cond <- '';
} else{
    cond <- paste( 'name', separator );
}


CairoPNG( filename='${imgout:Graph.png}', width=3/4*imageWidth, height=3/4*imageWidth );

# png(filename='${imgout:Graph.png}', type='cairo-png') #, width=700, height=300)

proc.time() - ptm;

filesArray      <- unlist( strsplit( filesString, split=',' ) );
studyVarsArray  <- unlist( strsplit( studyVarsString, split=';' ) );
colNames        <- sub( ' ', '_', studyVarsArray );

# flowSetToDisplay <- read.flowSet(files = filesArray, phenoData = list( Sample_Order = 'Sample Order', Replicate = 'Replicate' ) )

if ( population == '' ){

    fullPathToCDF <- paste( rootPath, '/Files.cdf', sep='' );
    suppressWarnings( flowSetToDisplay <- ncdfFlowSet_open( fullPathToCDF ) );

    fs <- flowSetToDisplay[ filesArray ];

    print('CONVERTING');
    system.time(
        fs <- NcdfFlowSetToFlowSet( fs )
    );

} else{
    print('LOADING DATA');
    ptm <- proc.time();

    G <- unarchive( paste( rootPath, '/GatingSet.tar', sep = '' ) );

    meta <- labkey.selectRows( baseUrl = labkey.url.base, folderPath = labkey.url.path, schemaName = 'Samples', queryName = 'Samples' );
    meta[,2] <- NULL; meta[,2] <- NULL; meta[,2] <- NULL;
    colnames(meta)[1] <- 'name';
    pData(G) <- meta;

    parentId <- match( population, getNodes( G[[1]] ) );

    proc.time() - ptm;
}

if ( length(colNames) > 0 ){
    colNames <- paste('factor(', colNames, ')', sep='');
    cond <- paste( cond, paste( colNames, collapse = separator ), sep = '' );

    if ( population == '' ){
        studyVarsList           <- list();
        studyVarsList           <- c( studyVarsList, studyVarsArray );
        names(studyVarsList)    <- colNames;
        studyVarsList           <- c( list( name='$FIL' ), studyVarsList );
        pData(fs) <- as.data.frame( keyword( fs, studyVarsList ) );
    }
}

print('PLOTTING');
ptm <- proc.time();

if ( xAxis == 'Time' ){
    if ( population == '' ){
        xAxis <- sub( '<', '', xAxis );
        yAxis <- sub( '<', '', yAxis );
        xAxis <- sub( '>', '', xAxis );
        yAxis <- sub( '>', '', yAxis );

        timeLinePlot( fs, yAxis );
    } else {
        timeLinePlot( getData( G[ filesArray ] ), yAxis );
    }
} else if ( yAxis == '' ){
    if ( population == '' ){
        xAxis <- sub( '<', '', xAxis );
        yAxis <- sub( '<', '', yAxis );
        xAxis <- sub( '>', '', xAxis );
        yAxis <- sub( '>', '', yAxis );

        argPlot <- as.formula( paste('~ `', xAxis, '`', sep='') );
        densityplot( argPlot, fs );
    } else {
        argPlot <- as.formula( paste('~ `', xAxis, '`', sep='') );
        densityplot( argPlot, getData( G[ filesArray ] ) );
    }
} else{

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

    if ( population == '' ){

        xAxis <- sub( '<', '', xAxis );
        yAxis <- sub( '<', '', yAxis );
        xAxis <- sub( '>', '', xAxis );
        yAxis <- sub( '>', '', yAxis );

        argPlot <- as.formula( paste( '`', yAxis, '` ~  `', xAxis, '`', ' | ', cond, sep='' ) );

        if ( xFlag & yFlag ){
            xyplot( argPlot, data=fs, smooth=F, xbin=bin, layout=layoutArg, xlab=labkey.url.params$xLab, ylab=labkey.url.params$yLab );
        } else{
            if ( xFlag & !(yFlag) ){
                trans <- estimateLogicle( x=fs[[1]], channels=c(yAxis) );
            } else if ( !(xFlag) & yFlag ){
                trans <- estimateLogicle( x=fs[[1]], channels=c(xAxis) );
            } else{ # !(xFlag) & !(yFlag)
                trans <- estimateLogicle( x=fs[[1]], channels=c(xAxis, yAxis) );
            }
            xyplot( argPlot, data=transform(fs,trans), smooth=F, xbin=bin, layout=layoutArg, xlab=labkey.url.params$xLab, ylab=labkey.url.params$yLab );
        }

    } else{

        print(parentId)
        print(xAxis)
        print(yAxis)
        print(cond)
        print(product)

        if ( cond == '' ){
            plotGate_labkey( G[ filesArray ], parentID = parentId, x = xAxis, y = yAxis, xbin = bin ); #, layout = layoutArg );
        } else {
            plotGate_labkey( G[ filesArray ], parentID = parentId, x = xAxis, y = yAxis, cond = cond, xbin = bin ); #, layout = layoutArg );
        }

    }

}

proc.time() - ptm;

dev.off();
