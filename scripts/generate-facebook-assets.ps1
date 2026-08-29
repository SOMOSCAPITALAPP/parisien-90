Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "public\social"
$heroPath = Join-Path $root "public\hero-stadium.png"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$eAcute = [char]0x00E9

function New-Color($hex, $alpha = 255) {
  $h = $hex.TrimStart("#")
  return [System.Drawing.Color]::FromArgb($alpha, [Convert]::ToInt32($h.Substring(0, 2), 16), [Convert]::ToInt32($h.Substring(2, 2), 16), [Convert]::ToInt32($h.Substring(4, 2), 16))
}

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-StringFormat($align = "Center", $line = "Center") {
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::$align
  $format.LineAlignment = [System.Drawing.StringAlignment]::$line
  return $format
}

function Set-Quality($g) {
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
}

function Draw-Profile {
  $size = 1080
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  Set-Quality $g

  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point 0, 0),
    (New-Object System.Drawing.Point $size, $size),
    (New-Color "#071426"),
    (New-Color "#06101f")
  )
  $g.FillRectangle($bgBrush, 0, 0, $size, $size)

  $outer = New-RoundedRectPath 34 34 1012 1012 218
  $g.DrawPath((New-Object System.Drawing.Pen (New-Color "#ffffff" 42), 8), $outer)

  $polyPoints = @(
    (New-Object System.Drawing.Point 540, 105),
    (New-Object System.Drawing.Point 872, 296),
    (New-Object System.Drawing.Point 872, 680),
    (New-Object System.Drawing.Point 540, 928),
    (New-Object System.Drawing.Point 208, 680),
    (New-Object System.Drawing.Point 208, 296)
  )
  $g.FillPolygon((New-Object System.Drawing.SolidBrush (New-Color "#1d4ed8" 48)), $polyPoints)
  $g.DrawPolygon((New-Object System.Drawing.Pen (New-Color "#72b9ff" 120), 10), $polyPoints)

  $stripePath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $stripePath.AddPolygon(@(
    (New-Object System.Drawing.Point 270, 210),
    (New-Object System.Drawing.Point 395, 210),
    (New-Object System.Drawing.Point 602, 860),
    (New-Object System.Drawing.Point 477, 860)
  ))
  $g.FillPath((New-Object System.Drawing.SolidBrush (New-Color "#e31b45")), $stripePath)

  $stripePath2 = New-Object System.Drawing.Drawing2D.GraphicsPath
  $stripePath2.AddPolygon(@(
    (New-Object System.Drawing.Point 405, 210),
    (New-Object System.Drawing.Point 510, 210),
    (New-Object System.Drawing.Point 717, 860),
    (New-Object System.Drawing.Point 612, 860)
  ))
  $g.FillPath((New-Object System.Drawing.SolidBrush (New-Color "#f6f8ff")), $stripePath2)

  $stripePath3 = New-Object System.Drawing.Drawing2D.GraphicsPath
  $stripePath3.AddPolygon(@(
    (New-Object System.Drawing.Point 520, 210),
    (New-Object System.Drawing.Point 645, 210),
    (New-Object System.Drawing.Point 852, 860),
    (New-Object System.Drawing.Point 727, 860)
  ))
  $g.FillPath((New-Object System.Drawing.SolidBrush (New-Color "#1557d6")), $stripePath3)

  $circleBrush = New-Object System.Drawing.SolidBrush (New-Color "#091a35" 246)
  $g.FillEllipse($circleBrush, 260, 260, 560, 560)
  $g.DrawEllipse((New-Object System.Drawing.Pen (New-Color "#f6f8ff" 88), 12), 260, 260, 560, 560)

  $goldPen = New-Object System.Drawing.Pen (New-Color "#f4c95d"), 24
  $goldPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $goldPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($goldPen, 540, 315, 540, 420)
  $g.FillEllipse((New-Object System.Drawing.SolidBrush (New-Color "#f4c95d")), 516, 274, 48, 48)

  $fontBig = New-Object System.Drawing.Font -ArgumentList @("Arial Black", 214, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $fontSmall = New-Object System.Drawing.Font -ArgumentList @("Arial", 38, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = New-StringFormat
  $g.DrawString("P90", $fontBig, (New-Object System.Drawing.SolidBrush (New-Color "#ffffff")), (New-Object System.Drawing.RectangleF 0, 430, $size, 230), $format)
  $g.DrawString("PARISIEN", $fontSmall, (New-Object System.Drawing.SolidBrush (New-Color "#a9d6ff")), (New-Object System.Drawing.RectangleF 0, 657, $size, 70), $format)

  $out = Join-Path $outDir "facebook-profile-parisien90.png"
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  return $out
}

function Draw-Cover {
  $w = 1640
  $h = 624
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  Set-Quality $g

  $hero = [System.Drawing.Image]::FromFile($heroPath)
  $srcW = $hero.Width
  $srcH = [int]($srcW * $h / $w)
  if ($srcH -gt $hero.Height) {
    $srcH = $hero.Height
    $srcW = [int]($srcH * $w / $h)
  }
  $srcX = [int](($hero.Width - $srcW) / 2)
  $srcY = 110
  if ($srcY + $srcH -gt $hero.Height) { $srcY = [int](($hero.Height - $srcH) / 2) }
  $g.DrawImage($hero, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), $srcX, $srcY, $srcW, $srcH, [System.Drawing.GraphicsUnit]::Pixel)
  $hero.Dispose()

  $shade = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point 0, 0),
    (New-Object System.Drawing.Point $w, 0),
    (New-Color "#06101f" 242),
    (New-Color "#06101f" 72)
  )
  $g.FillRectangle($shade, 0, 0, $w, $h)
  $bottom = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point 0, 360),
    (New-Object System.Drawing.Point 0, $h),
    (New-Color "#071426" 18),
    (New-Color "#071426" 228)
  )
  $g.FillRectangle($bottom, 0, 300, $w, 324)

  $markPath = New-RoundedRectPath 120 118 168 168 38
  $g.FillPath((New-Object System.Drawing.SolidBrush (New-Color "#071426" 220)), $markPath)
  $g.DrawPath((New-Object System.Drawing.Pen (New-Color "#72b9ff" 150), 4), $markPath)
  $markFont = New-Object System.Drawing.Font -ArgumentList @("Arial Black", 58, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString("P90", $markFont, (New-Object System.Drawing.SolidBrush (New-Color "#ffffff")), (New-Object System.Drawing.RectangleF 120, 160, 168, 72), (New-StringFormat))

  $kickerFont = New-Object System.Drawing.Font -ArgumentList @("Arial", 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $titleFont = New-Object System.Drawing.Font -ArgumentList @("Arial Black", 104, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $lineFont = New-Object System.Drawing.Font -ArgumentList @("Arial", 36, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $smallFont = New-Object System.Drawing.Font -ArgumentList @("Arial", 28, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

  $left = 330
  $g.DrawString("ACTU PSG  |  MERCATO  |  RECORDS  |  DEBATS", $kickerFont, (New-Object System.Drawing.SolidBrush (New-Color "#a9d6ff")), (New-Object System.Drawing.RectangleF $left, 128, 1100, 48), (New-StringFormat "Near" "Center"))
  $g.DrawString("PARISIEN 90", $titleFont, (New-Object System.Drawing.SolidBrush (New-Color "#ffffff")), (New-Object System.Drawing.RectangleF $left, 176, 1080, 130), (New-StringFormat "Near" "Center"))
  $coverLine = "Le m${eAcute}dia ind${eAcute}pendant des amoureux du Paris SG"
  $legalLine = "Non officiel - non affili${eAcute} au Paris Saint-Germain"
  $g.DrawString($coverLine, $lineFont, (New-Object System.Drawing.SolidBrush (New-Color "#f4c95d")), (New-Object System.Drawing.RectangleF $left, 306, 1120, 54), (New-StringFormat "Near" "Center"))

  $pillPath = New-RoundedRectPath $left 392 522 64 32
  $g.FillPath((New-Object System.Drawing.SolidBrush (New-Color "#e31b45" 224)), $pillPath)
  $g.DrawString("parisien90.com", $lineFont, (New-Object System.Drawing.SolidBrush (New-Color "#ffffff")), (New-Object System.Drawing.RectangleF $left, 394, 522, 60), (New-StringFormat))
  $g.DrawString($legalLine, $smallFont, (New-Object System.Drawing.SolidBrush (New-Color "#dbeafe")), (New-Object System.Drawing.RectangleF $left, 472, 850, 44), (New-StringFormat "Near" "Center"))

  $out = Join-Path $outDir "facebook-cover-parisien90.png"
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  return $out
}

$profile = Draw-Profile
$cover = Draw-Cover

[pscustomobject]@{
  Profile = $profile
  Cover = $cover
}
