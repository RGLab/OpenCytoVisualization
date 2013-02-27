print( 'LOADING LIBRARIES ETC.' );
ptm <- proc.time();

suppressMessages( library( Cairo ) );
suppressMessages( library( ncdfFlow ) );
suppressMessages( library( flowViz ) );
suppressMessages( library( flowWorkspace ) );
suppressMessages( library( Rlabkey ) );

imageWidth      <- as.numeric(labkey.url.params$imageWidth);
product         <- as.numeric(labkey.url.params$dimension);
bin             <- as.numeric(labkey.url.params$xbin);
xAxis           <- labkey.url.params$xAxis;
yAxis           <- labkey.url.params$yAxis;
filesString     <- labkey.url.params$filesNames;
gsPath          <- labkey.url.params$gsPath;
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

filesArray      <- unlist( strsplit( filesString, split = ',' ) );
studyVarsArray  <- unlist( strsplit( studyVarsString, split = ';' ) );

# flowSetToDisplay <- read.flowSet(files = filesArray, phenoData = list( Sample_Order = 'Sample Order', Replicate = 'Replicate' ) )

print( proc.time() - ptm ); # LOADING LIBRARIES ETC.

if ( population == '' ){

    fullPathToCDF <- paste( dirname(gsPath), '/Files.cdf', sep='' );
    suppressWarnings( flowSetToDisplay <- ncdfFlowSet_open( fullPathToCDF ) );

    fs <- flowSetToDisplay[ filesArray ];

    print('CONVERTING');
    system.time(
        fs <- NcdfFlowSetToFlowSet( fs )
    );

} else{
    print('LOADING DATA');
    ptm <- proc.time();

    if ( ! exists("G") ){
        G <- suppressMessages( unarchive( gsPath ) );
    }

    parentId <- match( population, getNodes( G[[1]] ) );

    print( proc.time() - ptm );
}

print('PLOTTING ETC.');
ptm <- proc.time();

if ( length(studyVarsArray) > 0 ){
    studyVarsArray <- paste('factor(`', studyVarsArray, '`)', sep = '' );
    cond <- paste( cond, paste( studyVarsArray, collapse = separator ), sep = '' );

    if ( population == '' ){
        studyVarsList           <- list();
        studyVarsList           <- c( studyVarsList, studyVarsArray );
        names(studyVarsList)    <- studyVarsArray;
        studyVarsList           <- c( list( name='$FIL' ), studyVarsList );
        pData(fs)               <- as.data.frame( keyword( fs, studyVarsList ) );
    }
}

if ( xAxis == 'Time' ){
    if ( population == '' ){
        xAxis <- sub( '<', '', xAxis );
        yAxis <- sub( '<', '', yAxis );
        xAxis <- sub( '>', '', xAxis );
        yAxis <- sub( '>', '', yAxis );

        print( timeLinePlot( fs, yAxis ) );
    } else {
        print( timeLinePlot( getData( G[ filesArray ] ), yAxis ) );
    }
} else if ( yAxis == '' ){
    if ( population == '' ){
        xAxis <- sub( '<', '', xAxis );
        yAxis <- sub( '<', '', yAxis );
        xAxis <- sub( '>', '', xAxis );
        yAxis <- sub( '>', '', yAxis );

        argPlot <- as.formula( paste('~ `', xAxis, '`', sep='') );
        print( densityplot( argPlot, fs ) );
    } else {
        argPlot <- as.formula( paste('~ `', xAxis, '`', sep='') );
        print( densityplot( argPlot, getData( G[ filesArray ] ) ) );
    }
} else{

    dim <- ceiling(sqrt(product));
    if ( product > dim * ( dim - 1 ) ){
        layoutArg <- c( dim, dim, 1 );
    } else{
        layoutArg <- c( dim, dim-1, 1 );
    }

    xFlag <- FALSE; yFlag <- FALSE;

	if ( grepl( 'FSC', xAxis, fixed = T ) | grepl( 'SSC', xAxis, fixed = T ) ){
	    xFlag <- TRUE;
    }
    if ( grepl( 'FSC', yAxis, fixed = T) | grepl( 'SSC', yAxis, fixed = T ) ){
	    yFlag <- TRUE;
    }

    if ( population == '' ){

        xAxis <- sub( '<', '', xAxis );
        yAxis <- sub( '<', '', yAxis );
        xAxis <- sub( '>', '', xAxis );
        yAxis <- sub( '>', '', yAxis );

        argPlot <- as.formula( paste( '`', yAxis, '` ~  `', xAxis, '`', ' | ', cond, sep='' ) );

        if ( xFlag & yFlag ){
            print( xyplot( argPlot, data=fs, smooth=F, xbin=bin, layout=layoutArg, xlab=labkey.url.params$xLab, ylab=labkey.url.params$yLab ) );
        } else{
            if ( xFlag & !(yFlag) ){
                trans <- estimateLogicle( x=fs[[1]], channels=c(yAxis) );
            } else if ( !(xFlag) & yFlag ){
                trans <- estimateLogicle( x=fs[[1]], channels=c(xAxis) );
            } else{ # !(xFlag) & !(yFlag)
                trans <- estimateLogicle( x=fs[[1]], channels=c(xAxis, yAxis) );
            }
            print( xyplot( argPlot, data=transform(fs,trans), smooth=F, xbin=bin, layout=layoutArg, xlab=labkey.url.params$xLab, ylab=labkey.url.params$yLab ) );
        }

    } else{

        # print(filesArray)
        # print(parentId)
        # print(xAxis)
        # print(yAxis)
        # print(cond)
        # print(product)
        # print(layoutArg)
        # print( ls.str() )

        if ( cond == '' ){
            print( plotGate_labkey( G[ filesArray ], parentID = parentId, x = xAxis, y = yAxis, margin = T, xbin = bin, layout = layoutArg )[[1]] );
        } else {
            print( plotGate_labkey( G[ filesArray ], parentID = parentId, x = xAxis, y = yAxis, margin = T, xbin = bin, cond = cond, layout = layoutArg )[[1]] );
        }

    }

}

print( proc.time() - ptm );

dev.off();
