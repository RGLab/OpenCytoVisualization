print( 'LOADING LIBRARIES ETC.' );
ptm <- proc.time();

suppressMessages( library( ncdfFlow ) );
suppressMessages( library( flowWorkspace ) );

gsPath          <- labkey.url.params$gsPath;

# flowSetToDisplay <- read.flowSet(files = filesArray, phenoData = list( Sample_Order = 'Sample Order', Replicate = 'Replicate' ) )

print( proc.time() - ptm ); # LOADING LIBRARIES ETC.

if ( gsPath == '' ){

    # LEGACY PART
    fullPathToCDF <- paste0( dirname(gsPath), '/Files.cdf' );
    suppressWarnings( flowSetToDisplay <- ncdfFlowSet_open( fullPathToCDF ) );

    fs <- flowSetToDisplay[ filesArray ];

    print('CONVERTING');
    G <- NcdfFlowSetToFlowSet( fs ); # G used to be fs !

} else{
    print('LOADING DATA');
    ptm <- proc.time();

    G <- suppressMessages( flowWorkspace:::load_gs( gsPath ) );

    txt <- 'gating set loaded';

    print( proc.time() - ptm );
}

write(txt, file='${txtout:textOutput}');
