Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap('public\images\cameras\canon-a1.jfif')
$color = $bmp.GetPixel(10, 10)
Write-Output ("#{0:X2}{1:X2}{2:X2}" -f $color.R, $color.G, $color.B)
