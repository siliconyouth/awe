import { ApiTester } from "../../../components/api-tester";
import { PageContainer } from '../../../components/layout/page-container'
import { PageHeader } from '../../../components/layout/page-header'
import { designSystem, cn } from '../../../lib/design-system'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Terminal, Code2, Shield, Zap, CheckCircle } from 'lucide-react'

// No need for auth check - handled by layout
export default function TestApiPage() {
  return (
    <PageContainer className={cn(designSystem.animations.fadeIn)} maxWidth="2xl">
      <PageHeader
        title="Backend API Testing"
        description="Test authenticated backend requests using Clerk session tokens"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'API Testing' }
        ]}
        actions={
          <Badge className={cn(
            designSystem.components.badge.default,
            'bg-green-50 text-green-700 border-green-200',
            'dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30'
          )}>
            <Shield className="w-3 h-3 mr-1" />
            Authenticated
          </Badge>
        }
      />
      
      <div className={cn(
        'space-y-8',
        designSystem.animations.slideUp
      )}>
        <Card className={cn(
          designSystem.components.card.hover,
          'group relative overflow-hidden'
        )}>
          <div className={cn(
            'absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-xl',
            'bg-gradient-to-br from-blue-400 to-purple-600'
          )} />
          <CardHeader className="relative">
            <CardTitle className={cn(
              designSystem.typography.heading[3],
              'flex items-center gap-3'
            )}>
              <div className={cn(
                'p-3 rounded-xl',
                'bg-blue-50 dark:bg-blue-950/30',
                designSystem.animations.hover.scale
              )}>
                <Terminal className="h-6 w-6 text-blue-600" />
              </div>
              Interactive API Tester
            </CardTitle>
            <CardDescription>
              Test your API endpoints with full authentication support
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <ApiTester />
          </CardContent>
        </Card>
        
        <Card className={cn(
          designSystem.components.card.hover,
          'group relative overflow-hidden',
          designSystem.animations.slideUp,
          'delay-100'
        )}>
          <div className={cn(
            'absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-xl',
            'bg-gradient-to-br from-emerald-400 to-teal-600'
          )} />
          <CardHeader className="relative">
            <CardTitle className={cn(
              designSystem.typography.heading[3],
              'flex items-center gap-3'
            )}>
              <div className={cn(
                'p-3 rounded-xl',
                'bg-emerald-50 dark:bg-emerald-950/30',
                designSystem.animations.hover.scale
              )}>
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              How It Works
            </CardTitle>
            <CardDescription>
              Authentication flow for API requests
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              <div className={cn(
                'flex items-start gap-4 p-4 rounded-xl',
                'bg-gradient-to-r from-blue-50/50 to-cyan-50/50',
                'dark:from-blue-950/20 dark:to-cyan-950/20',
                'border border-blue-100 dark:border-blue-900/30',
                designSystem.animations.hover.lift
              )}>
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full',
                  'bg-blue-100 dark:bg-blue-900/30',
                  'flex items-center justify-center',
                  'text-sm font-semibold text-blue-600'
                )}>1</div>
                <div className="space-y-1">
                  <p className={cn('text-sm', designSystem.typography.body.default)}>
                    The client calls <code className={cn(
                      'px-2 py-1 rounded text-xs',
                      'bg-muted font-mono text-foreground'
                    )}>useAuth().getToken()</code> to get the session token
                  </p>
                </div>
              </div>
              
              <div className={cn(
                'flex items-start gap-4 p-4 rounded-xl',
                'bg-gradient-to-r from-emerald-50/50 to-teal-50/50',
                'dark:from-emerald-950/20 dark:to-teal-950/20',
                'border border-emerald-100 dark:border-emerald-900/30',
                designSystem.animations.hover.lift
              )}>
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full',
                  'bg-emerald-100 dark:bg-emerald-900/30',
                  'flex items-center justify-center',
                  'text-sm font-semibold text-emerald-600'
                )}>2</div>
                <div className="space-y-1">
                  <p className={cn('text-sm', designSystem.typography.body.default)}>
                    The token is added to the <code className={cn(
                      'px-2 py-1 rounded text-xs',
                      'bg-muted font-mono text-foreground'
                    )}>Authorization</code> header as a Bearer token
                  </p>
                </div>
              </div>
              
              <div className={cn(
                'flex items-start gap-4 p-4 rounded-xl',
                'bg-gradient-to-r from-purple-50/50 to-pink-50/50',
                'dark:from-purple-950/20 dark:to-pink-950/20',
                'border border-purple-100 dark:border-purple-900/30',
                designSystem.animations.hover.lift
              )}>
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full',
                  'bg-purple-100 dark:bg-purple-900/30',
                  'flex items-center justify-center',
                  'text-sm font-semibold text-purple-600'
                )}>3</div>
                <div className="space-y-1">
                  <p className={cn('text-sm', designSystem.typography.body.default)}>
                    The API route uses <code className={cn(
                      'px-2 py-1 rounded text-xs',
                      'bg-muted font-mono text-foreground'
                    )}>auth()</code> to verify the token and get user info
                  </p>
                </div>
              </div>
              
              <div className={cn(
                'flex items-start gap-4 p-4 rounded-xl',
                'bg-gradient-to-r from-amber-50/50 to-orange-50/50',
                'dark:from-amber-950/20 dark:to-orange-950/20',
                'border border-amber-100 dark:border-amber-900/30',
                designSystem.animations.hover.lift
              )}>
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full',
                  'bg-amber-100 dark:bg-amber-900/30',
                  'flex items-center justify-center',
                  'text-sm font-semibold text-amber-600'
                )}>4</div>
                <div className="space-y-1">
                  <p className={cn('text-sm', designSystem.typography.body.default)}>
                    Protected routes can check roles and permissions before processing requests
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          designSystem.components.card.hover,
          'group relative overflow-hidden',
          designSystem.animations.slideUp,
          'delay-200'
        )}>
          <div className={cn(
            'absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-xl',
            'bg-gradient-to-br from-indigo-400 to-purple-600'
          )} />
          <CardHeader className="relative">
            <CardTitle className={cn(
              designSystem.typography.heading[3],
              'flex items-center gap-3'
            )}>
              <div className={cn(
                'p-3 rounded-xl',
                'bg-indigo-50 dark:bg-indigo-950/30',
                designSystem.animations.hover.scale
              )}>
                <Code2 className="h-6 w-6 text-indigo-600" />
              </div>
              Server Actions
            </CardTitle>
            <CardDescription>
              Simplified authentication for server-side functions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <div className={cn(
              'flex items-center gap-3 p-4 rounded-xl',
              'bg-green-50/50 dark:bg-green-950/20',
              'border border-green-100 dark:border-green-900/30'
            )}>
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className={cn('text-sm', designSystem.typography.body.default)}>
                Server actions automatically have access to the authenticated user context.
                No need to manually pass tokens.
              </p>
            </div>
            
            <div className={cn(
              'rounded-xl overflow-hidden',
              'bg-gray-950 dark:bg-gray-900',
              'border border-gray-200 dark:border-gray-800'
            )}>
              <div className={cn(
                'flex items-center gap-2 px-4 py-2',
                'bg-gray-100 dark:bg-gray-800',
                'border-b border-gray-200 dark:border-gray-700'
              )}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-sm text-muted-foreground font-mono">server-action.ts</span>
              </div>
              <pre className={cn(
                'p-4 text-sm overflow-x-auto',
                'text-gray-100 font-mono leading-relaxed'
              )}>
<span className="text-gray-500">// In a Server Action</span>
<span className="text-blue-400">'use server'</span>;

<span className="text-purple-400">import</span> {'{ auth }'} <span className="text-purple-400">from</span> <span className="text-green-400">"@clerk/nextjs/server"</span>;

<span className="text-purple-400">export</span> <span className="text-purple-400">async</span> <span className="text-purple-400">function</span> <span className="text-yellow-400">myServerAction</span>() {'{'}
  <span className="text-purple-400">const</span> {'{ userId }'} = <span className="text-purple-400">await</span> <span className="text-yellow-400">auth</span>();
  
  <span className="text-purple-400">if</span> (!userId) {'{'}
    <span className="text-purple-400">throw</span> <span className="text-purple-400">new</span> <span className="text-yellow-400">Error</span>(<span className="text-green-400">"Unauthorized"</span>);
  {'}'}
  
  <span className="text-gray-500">// Your action logic here</span>
{'}'}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}