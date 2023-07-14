import { Backdrop, CircularProgress } from '@mui/material';
// import { useSelector } from 'react-redux';
// import { RootState } from 'src/redux/store';

type Props = {
  open: boolean;
};

const Loader = ({ open }: Props) => (
  // const { workload } = useSelector((rootState: RootState) => rootState.ui);

  <Backdrop open={open}>
    <CircularProgress />
  </Backdrop>
);
export default Loader;
