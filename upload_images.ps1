$bucket = "bidxaagui-editions"
$prefix = "campaigns/2nd-edition/"
$localDir = "..\Correo electrónico bidxaagui\images"

$images = @(
    "17e9dd289b0d2bd4b69a9c0b340e1378.png",
    "a2323c5e2375d845228fe4d1afea1394.png",
    "a81098bc26e31d10d64dadb743766e26.png",
    "b32802f98e79a4d14c30f307a87c42fd.png",
    "d0733d1020a7521da22d75702e3c1f1d.png",
    "dfc5cb3018667e56650212d8a2e1e914.png",
    "fb654938fe68e7d47957d523755d1669.png"
)

foreach ($img in $images) {
    echo "Uploading $img ..."
    $cmd = "npx wrangler r2 object put $bucket/$prefix$img --file=`"$localDir\$img`""
    Invoke-Expression $cmd
}
