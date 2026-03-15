import { Typography} from '@mui/material'
import AppLayout from '../components/AppLayout'
import DashboardSummaryCards from '../components/dashboard/DashboardSummaryCards'

export default function Home() {
  return (
    <AppLayout>

        <Typography variant="h4">
          Welcome to PrepSheet Dashboard
        </Typography>
        <DashboardSummaryCards />
      </AppLayout>
  )
}
