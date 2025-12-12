import { Helmet } from 'react-helmet-async'

const SEO = ({ title, description, image, url, type = 'website', keywords, author }) => {
    const siteTitle = 'Gorer Mart | Kolkata T-Shirts'
    const siteUrl = 'https://gorermart.com'
    const fullTitle = title ? `${title} | Gorer Mart` : siteTitle
    const fullUrl = url ? `${siteUrl}${url}` : siteUrl
    const fullImage = image || `${siteUrl}/og-image.png`
    const fullDescription = description || 'Kolkata-inspired t-shirts with nostalgia, aesthetics, and attitude. Small batch drops, local printing, authentic vibes.'

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={fullDescription} />
            {keywords && <meta name="keywords" content={keywords} />}
            {author && <meta name="author" content={author} />}
            <meta name="viewport" content="width=device-width, initial-scale=1" />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={fullDescription} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content="Gorer Mart" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={fullDescription} />
            <meta name="twitter:image" content={fullImage} />

            {/* JSON-LD Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': type === 'product' ? 'Product' : 'Organization',
                    name: 'Gorer Mart',
                    description: fullDescription,
                    url: siteUrl,
                    image: fullImage,
                    logo: `${siteUrl}/logo-white.png`,
                    sameAs: [
                        'https://instagram.com/gorermart',
                        'https://twitter.com/gorermart',
                    ],
                })}
            </script>

            {/* Preconnect to external resources */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

            {/* Canonical */}
            <link rel="canonical" href={fullUrl} />
        </Helmet>
    )
}

export default SEO
