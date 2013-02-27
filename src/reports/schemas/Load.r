print( 'LOADING LIBRARIES ETC.' );
ptm <- proc.time();

suppressMessages( library( Cairo ) );
suppressMessages( library( ncdfFlow ) );
suppressMessages( library( flowViz ) );
suppressMessages( library( flowWorkspace ) );
suppressMessages( library( Rlabkey ) );

gsPath          <- labkey.url.params$gsPath;

# flowSetToDisplay <- read.flowSet(files = filesArray, phenoData = list( Sample_Order = 'Sample Order', Replicate = 'Replicate' ) )

print( proc.time() - ptm ); # LOADING LIBRARIES ETC.

if ( gsPath == '' ){

    fullPathToCDF <- paste( dirname(gsPath), '/Files.cdf', sep='' );
    suppressWarnings( flowSetToDisplay <- ncdfFlowSet_open( fullPathToCDF ) );

    fs <- flowSetToDisplay[ filesArray ];

    print('CONVERTING');
    G <- NcdfFlowSetToFlowSet( fs ); # G used to be fs !

} else{
    print('LOADING DATA');
    ptm <- proc.time();

    G <- suppressMessages( unarchive( gsPath ) );

    txt <- 'gating set loaded';

    print( proc.time() - ptm );
}

write(txt, file='${txtout:textOutput}');
